import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument, degrees } from 'pdf-lib';
import FileUploader from '../shared/FileUploader';
import { RotateCw, RotateCcw, Download, Loader2, AlertTriangle, Save } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function RotatePdf() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]); // { pageNum, dataUrl }
  const [rotations, setRotations] = useState([]); // Array tracking degrees for each page
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (files) => {
    try {
      const selectedFile = files[0];
      setFile(selectedFile);
      setResultUrl(null);
      setError(null);

      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Initialize rotation state (0 degrees for every page)
      setRotations(new Array(loadedPdf.numPages).fill(0));
      
      // Generate UI thumbnails
      const thumbs = [];
      for (let i = 1; i <= loadedPdf.numPages; i++) {
        const page = await loadedPdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push({ pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.5) });
      }
      setThumbnails(thumbs);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setError("Could not read the PDF. It might be encrypted or corrupted.");
      setFile(null);
    }
  };

  // Adjust rotation state for a single page
  const rotatePage = (index, direction) => {
    setRotations(prev => {
      const newRots = [...prev];
      newRots[index] = newRots[index] + (direction === 'right' ? 90 : -90);
      return newRots;
    });
  };

  // Adjust rotation state for ALL pages
  const rotateAll = (direction) => {
    setRotations(prev => prev.map(rot => rot + (direction === 'right' ? 90 : -90)));
  };

  const saveRotatedPdf = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Load the original file into pdf-lib
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // 2. Apply the tracked rotations to the actual PDF pages
      pages.forEach((page, index) => {
        const rotationToAdd = rotations[index] % 360;
        if (rotationToAdd !== 0) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + rotationToAdd));
        }
      });

      // 3. Serialize and create download link
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Rotation error:", err);
      setError("An error occurred while saving the document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setThumbnails([]);
    setRotations([]);
    setResultUrl(null);
    setError(null);
  };

  // Check if any changes have actually been made
  const hasChanges = rotations.some(rot => rot % 360 !== 0);

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <RotateCw className="text-teal-500" /> Rotate PDF
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
            <div className="space-y-6">
              
              {/* Top Controls Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => rotateAll('left')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> All Left
                  </button>
                  <button 
                    onClick={() => rotateAll('right')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
                  >
                    All Right <RotateCw className="w-4 h-4" />
                  </button>
                </div>
                
                <button 
                  onClick={saveRotatedPdf}
                  disabled={isProcessing || !hasChanges}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  Apply Changes
                </button>
              </div>

              {/* Visual Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100 max-h-[600px] overflow-y-auto">
                {thumbnails.map((thumb, index) => (
                  <div key={index} className="flex flex-col items-center gap-3">
                    {/* Thumbnail Container */}
                    <div className="w-full aspect-[1/1.4] bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center overflow-hidden p-2">
                      <img 
                        src={thumb.dataUrl} 
                        alt={`Page ${thumb.pageNum}`} 
                        className="max-w-full max-h-full object-contain transition-transform duration-300"
                        style={{ transform: `rotate(${rotations[index]}deg)` }}
                      />
                    </div>
                    
                    {/* Page Controls */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => rotatePage(index, 'left')}
                        className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                        aria-label="Rotate Left"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold text-gray-500 w-12 text-center">
                        Pg {thumb.pageNum}
                      </span>
                      <button 
                        onClick={() => rotatePage(index, 'right')}
                        className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                        aria-label="Rotate Right"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Rotation Complete!</h3>
          <p className="text-green-600 mb-8">Your PDF pages have been permanently rotated.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={resultUrl} 
              download={`Rotated_${file.name}`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download PDF
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Rotate Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}