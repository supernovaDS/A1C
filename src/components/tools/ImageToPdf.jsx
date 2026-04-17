import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import FileUploader from '../shared/FileUploader';
import { FileImage, Download, Loader2, X, Plus } from 'lucide-react';

export default function ImageToPdf() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Clean up memory leaks when the component unmounts
  useEffect(() => {
    return () => files.forEach(f => URL.revokeObjectURL(f.preview));
  }, [files]);

  const handleFileSelect = (newFiles) => {
    // Wrap the raw File object with a temporary URL for the image preview
    const filesWithPreviews = newFiles.map(file => ({
      rawFile: file,
      preview: URL.createObjectURL(file)
    }));
    
    setFiles((prev) => [...prev, ...filesWithPreviews]);
    setPdfUrl(null); 
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => {
      // Revoke the URL to free up browser memory before removing
      URL.revokeObjectURL(prev[indexToRemove].preview);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const convertToPdf = async () => {
    if (files.length === 0) return;
    setIsConverting(true);

    try {
      const pdfDoc = await PDFDocument.create();
      
      // Standard A4 Dimensions in points (72 points per inch)
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;
      
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        const imageBytes = await fileObj.rawFile.arrayBuffer();
        
        let image;
        if (fileObj.rawFile.type === 'image/jpeg' || fileObj.rawFile.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (fileObj.rawFile.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue; 
        }

        const { width: imgWidth, height: imgHeight } = image.scale(1);
        
        // Add a standard A4 page
        const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

        // Calculate aspect ratio to fit the image entirely within the A4 page
        // (Adding a small 20pt margin padding so it doesn't touch the exact edges)
        const margin = 20;
        const maxWidth = A4_WIDTH - (margin * 2);
        const maxHeight = A4_HEIGHT - (margin * 2);
        
        const scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;

        // Calculate X and Y to perfectly center the image on the page
        const x = (A4_WIDTH - scaledWidth) / 2;
        const y = (A4_HEIGHT - scaledHeight) / 2;

        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
    } catch (error) {
      console.error("Batch conversion failed:", error);
      alert("Something went wrong during conversion. Ensure files are valid JPG/PNGs.");
    } finally {
      setIsConverting(false);
    }
  };

  const resetTool = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview)); // Clean up URLs
    setFiles([]);
    setPdfUrl(null);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FileImage className="text-blue-500" />
        Images to PDF
      </h2>

      {!pdfUrl ? (
        <>
          <FileUploader 
            onFilesSelected={handleFileSelect} 
            accept={{ 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] }} 
          />
          
          {files.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">File Queue ({files.length})</h3>
              </div>
              
              <ul className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-2">
                {files.map((fileObj, index) => (
                  <li 
                    key={`${fileObj.rawFile.name}-${index}`} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 shrink-0 bg-white border border-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                        <img 
                          src={fileObj.preview} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* File Details */}
                      <div className="flex flex-col truncate">
                        <span className="font-medium text-gray-800 text-sm sm:text-base truncate">
                          {fileObj.rawFile.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(fileObj.rawFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-all active:scale-95 shrink-0"
                      aria-label="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>

              <button 
                onClick={convertToPdf}
                disabled={isConverting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isConverting ? <Loader2 className="animate-spin w-6 h-6" /> : 'Convert to Single PDF'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-xl sm:text-2xl font-bold text-green-700 mb-2">Batch Conversion Complete!</h3>
          <p className="text-green-600 mb-6">Successfully combined {files.length} images into one uniform A4 PDF.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={pdfUrl} 
              download={`Combined_${files.length}_Images.pdf`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download PDF
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Convert More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}