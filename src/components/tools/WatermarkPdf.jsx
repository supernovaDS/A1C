import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import FileUploader from '../shared/FileUploader';
import { Stamp, Download, Loader2, AlertTriangle, Type } from 'lucide-react';

export default function WatermarkPdf() {
  const [file, setFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (files) => {
    setFile(files[0]);
    setResultUrl(null);
    setError(null);
  };

  const applyWatermark = async () => {
    if (!file) return;
    if (!watermarkText.trim()) {
      setError("Please enter text for the watermark.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      
      // Embed the standard Helvetica font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      // Loop through all pages to apply the watermark
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        
        // Dynamically size the text based on page width (max 80pt)
        const fontSize = Math.min(80, width / 8); 
        const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);

        // Draw the text in the center, rotated 45 degrees
        page.drawText(watermarkText, {
          x: width / 2 - (textWidth / 2) * Math.cos(Math.PI / 4) + (textHeight / 2) * Math.sin(Math.PI / 4),
          y: height / 2 - (textWidth / 2) * Math.sin(Math.PI / 4) - (textHeight / 2) * Math.cos(Math.PI / 4),
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5), // Medium Gray
          opacity: opacity,
          rotate: degrees(45),
        });
      });

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
    setResultUrl(null);
    setError(null);
    setWatermarkText('CONFIDENTIAL');
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Stamp className="text-purple-500" /> Watermark PDF
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

              {/* Watermark Settings */}
              <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-6">
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
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all uppercase tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Text Opacity</label>
                    <span className="text-sm text-gray-500">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" max="1" step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
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
                  disabled={isProcessing || !watermarkText.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Stamp className="w-5 h-5" />}
                  Stamp Document
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-purple-50 rounded-xl border border-purple-200">
          <h3 className="text-2xl font-bold text-purple-700 mb-2">Watermark Applied!</h3>
          <p className="text-purple-600 mb-8">Your text has been stamped across all pages of the document.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={resultUrl} 
              download={`Watermarked_${file.name}`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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