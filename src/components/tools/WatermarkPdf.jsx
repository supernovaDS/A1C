import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import FileUploader from '../shared/FileUploader';
import { Stamp, Download, Loader2, AlertTriangle, Type, ImageIcon, UploadCloud, X } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function WatermarkPdf() {
  const [file, setFile] = useState(null);
  const [fileArrayBuffer, setFileArrayBuffer] = useState(null);

  // Watermark mode: 'text' or 'image'
  const [mode, setMode] = useState('text');

  // Text watermark settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);

  // Image watermark settings
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState(null);
  const [imageScale, setImageScale] = useState(0.3);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const previewCanvasRef = useRef(null);

  const handleFileSelect = async (files) => {
    const selectedFile = files[0];
    setFile(selectedFile);
    setResultUrl(null);
    setError(null);
    const ab = await selectedFile.arrayBuffer();
    setFileArrayBuffer(ab);
  };

  const handleWatermarkImageSelect = (e) => {
    const imgFile = e.target.files[0];
    if (!imgFile) return;
    setWatermarkImage(imgFile);
    setWatermarkImagePreview(URL.createObjectURL(imgFile));
  };

  // Render preview of first page with watermark overlay
  const renderPreview = useCallback(async () => {
    if (!fileArrayBuffer || !previewCanvasRef.current) return;

    try {
      // Must copy the buffer since pdfjs transfers it
      const bufferCopy = fileArrayBuffer.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: bufferCopy }).promise;
      const page = await pdf.getPage(1);

      const scale = 1.0;
      const viewport = page.getViewport({ scale });

      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the PDF page
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Overlay watermark
      ctx.save();
      ctx.globalAlpha = opacity;

      if (mode === 'text' && watermarkText.trim()) {
        const fontSize = Math.min(80, viewport.width / 8);
        ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
        ctx.fillStyle = '#808080';

        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;

        ctx.translate(viewport.width / 2, viewport.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(watermarkText, -textWidth / 2, 0);
      } else if (mode === 'image' && watermarkImagePreview) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = watermarkImagePreview;
        await new Promise((resolve, reject) => {
          if (img.complete && img.naturalWidth > 0) { resolve(); return; }
          img.onload = resolve;
          img.onerror = reject;
        });

        const imgW = img.naturalWidth * imageScale;
        const imgH = img.naturalHeight * imageScale;

        ctx.translate(viewport.width / 2, viewport.height / 2);
        ctx.rotate(-Math.PI / 4);
        ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
      }

      ctx.restore();
    } catch (err) {
      console.error("Preview render error:", err);
    }
  }, [fileArrayBuffer, watermarkText, opacity, mode, watermarkImagePreview, imageScale]);

  useEffect(() => {
    if (fileArrayBuffer) {
      renderPreview();
    }
  }, [fileArrayBuffer, renderPreview]);

  const applyWatermark = async () => {
    if (!file) return;

    if (mode === 'text' && !watermarkText.trim()) {
      setError("Please enter text for the watermark.");
      return;
    }
    if (mode === 'image' && !watermarkImage) {
      setError("Please select an image for the watermark.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();

      if (mode === 'text') {
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        pages.forEach((page) => {
          const { width, height } = page.getSize();
          const fontSize = Math.min(80, width / 8); 
          const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = helveticaFont.heightAtSize(fontSize);

          page.drawText(watermarkText, {
            x: width / 2 - (textWidth / 2) * Math.cos(Math.PI / 4) + (textHeight / 2) * Math.sin(Math.PI / 4),
            y: height / 2 - (textWidth / 2) * Math.sin(Math.PI / 4) - (textHeight / 2) * Math.cos(Math.PI / 4),
            size: fontSize,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5),
            opacity: opacity,
            rotate: degrees(45),
          });
        });
      } else {
        // Image watermark
        const imgBytes = await watermarkImage.arrayBuffer();
        const imgUint8 = new Uint8Array(imgBytes);
        
        let embeddedImg;
        const imgType = watermarkImage.type;
        if (imgType === 'image/png') {
          embeddedImg = await pdfDoc.embedPng(imgUint8);
        } else {
          // For jpg and other formats, embed as jpg
          embeddedImg = await pdfDoc.embedJpg(imgUint8);
        }

        const imgDims = embeddedImg.scale(imageScale);

        pages.forEach((page) => {
          const { width, height } = page.getSize();

          page.drawImage(embeddedImg, {
            x: width / 2 - imgDims.width / 2,
            y: height / 2 - imgDims.height / 2,
            width: imgDims.width,
            height: imgDims.height,
            opacity: opacity,
            rotate: degrees(45),
          });
        });
      }

      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));

    } catch (err) {
      console.error("Watermark error:", err);
      setError("Failed to apply watermark. The file might be encrypted or corrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setFileArrayBuffer(null);
    setResultUrl(null);
    setError(null);
    setWatermarkText('CONFIDENTIAL');
    setWatermarkImage(null);
    if (watermarkImagePreview) URL.revokeObjectURL(watermarkImagePreview);
    setWatermarkImagePreview(null);
    setMode('text');
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Stamp className="text-blue-500" /> Watermark PDF
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!resultUrl ? (
        <>
          {!file ? (
            <FileUploader onFilesSelected={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} maxFiles={1} />
          ) : (
            <div className="space-y-6 mt-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-700 truncate">{file.name}</span>
                <span className="text-sm text-gray-500 shrink-0">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              {/* Two-column layout: Settings + Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Settings */}
                <div className="space-y-5">
                  {/* Mode Toggle */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMode('text')}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        mode === 'text' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <Type className={`w-5 h-5 mx-auto mb-1 ${mode === 'text' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-gray-700">Text</span>
                    </button>
                    <button
                      onClick={() => setMode('image')}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        mode === 'image' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <ImageIcon className={`w-5 h-5 mx-auto mb-1 ${mode === 'image' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="text-sm font-semibold text-gray-700">Image</span>
                    </button>
                  </div>

                  {/* Watermark Settings */}
                  <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-5">
                    {mode === 'text' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Watermark Text
                        </label>
                        <div className="relative">
                          <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input 
                            type="text" 
                            value={watermarkText}
                            onChange={(e) => setWatermarkText(e.target.value.toUpperCase())}
                            placeholder="e.g., DRAFT, CONFIDENTIAL"
                            maxLength={30}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase tracking-wider"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Watermark Image
                        </label>
                        {!watermarkImagePreview ? (
                          <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                            <UploadCloud className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-600 font-medium">Click to select image</span>
                            <span className="text-xs text-gray-400">PNG or JPG</span>
                            <input 
                              type="file" 
                              accept="image/png,image/jpeg,image/jpg" 
                              onChange={handleWatermarkImageSelect} 
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="relative">
                            <img src={watermarkImagePreview} alt="Watermark" className="w-full h-32 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                            <button 
                              onClick={() => { setWatermarkImage(null); URL.revokeObjectURL(watermarkImagePreview); setWatermarkImagePreview(null); }}
                              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {watermarkImagePreview && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-sm font-medium text-gray-700">Scale</label>
                              <span className="text-sm text-gray-500">{Math.round(imageScale * 100)}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.1" max="1" step="0.05"
                              value={imageScale}
                              onChange={(e) => setImageScale(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Opacity</label>
                        <span className="text-sm text-gray-500">{Math.round(opacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" max="1" step="0.1"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Faint</span>
                        <span>Solid</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={resetTool}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={applyWatermark}
                      disabled={isProcessing || (mode === 'text' && !watermarkText.trim()) || (mode === 'image' && !watermarkImage)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Stamp className="w-5 h-5" />}
                      Stamp Document
                    </button>
                  </div>
                </div>

                {/* Right: Preview */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 self-start">Live Preview — Page 1</h3>
                  <div className="w-full bg-gray-100 rounded-xl border border-gray-200 p-3 flex items-center justify-center overflow-hidden" style={{ minHeight: '400px' }}>
                    <canvas 
                      ref={previewCanvasRef}
                      className="max-w-full max-h-[500px] rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="text-2xl font-bold text-blue-700 mb-2">Watermark Applied!</h3>
          <p className="text-blue-600 mb-8">Your {mode} watermark has been stamped across all pages of the document.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={resultUrl} 
              download={`Watermarked_${file.name}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download PDF
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Watermark Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
