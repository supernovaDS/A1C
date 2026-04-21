import React, { useState } from 'react';
import FileUploader from '../shared/FileUploader';
import { ImageIcon, Download, Loader2, AlertTriangle, Settings, ArrowRight } from 'lucide-react';

export default function ImageConverter() {
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [quality, setQuality] = useState(0.8); // 80% quality default
  
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState(null); // { url, name, newSize }
  const [error, setError] = useState(null);

  const handleFileSelect = (files) => {
    setFile(files[0]);
    setResult(null);
    setError(null);
  };

  const convertImage = () => {
    if (!file) return;
    setIsConverting(true);
    setError(null);

    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas matching the image dimensions
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          // If converting to JPG, fill a white background first to prevent transparent areas turning black
          if (targetFormat === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Draw the original image onto the canvas
          ctx.drawImage(img, 0, 0);

          // Export the canvas to the new format
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                setError("Conversion failed. The image might be too large.");
                setIsConverting(false);
                return;
              }
              
              const url = URL.createObjectURL(blob);
              
              // Generate the new filename (e.g., photo.png -> photo.webp)
              const originalName = file.name.split('.')[0];
              const ext = targetFormat.split('/')[1]; 
              const newFileName = `${originalName}.${ext}`;

              setResult({
                url,
                name: newFileName,
                newSize: blob.size
              });
              setIsConverting(false);
            },
            targetFormat,
            targetFormat === 'image/png' ? undefined : quality // PNG doesn't use lossy quality
          );
        };
        img.onerror = () => {
          setError("Failed to load the image. It might be corrupted.");
          setIsConverting(false);
        };
        img.src = event.target.result;
      };
      
      reader.onerror = () => {
        setError("Failed to read the file.");
        setIsConverting(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
      setIsConverting(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ImageIcon className="text-pink-500" /> Image Converter
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!result ? (
        <>
          <FileUploader 
            onFilesSelected={handleFileSelect} 
            accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }} 
            maxFiles={1}
          />
          
          {file && (
            <div className="mt-8 space-y-6">
              
              {/* Settings Panel */}
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-6">
                
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 truncate mr-4">{file.name}</span>
                  <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-md border">
                    {formatSize(file.size)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Convert To
                    </label>
                    <select 
                      value={targetFormat}
                      onChange={(e) => setTargetFormat(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 font-medium text-gray-700"
                    >
                      <option value="image/jpeg">JPG</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WEBP</option>
                    </select>
                  </div>

                  {targetFormat !== 'image/png' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Quality</label>
                        <span className="text-sm text-gray-500 font-medium">{Math.round(quality * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" max="1" step="0.1"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500 mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={convertImage}
                disabled={isConverting}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isConverting ? <Loader2 className="animate-spin w-6 h-6" /> : 'Convert Image Now'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-pink-50 rounded-xl border border-pink-200">
          <h3 className="text-2xl font-bold text-pink-700 mb-6">Conversion Complete!</h3>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="text-right">
              <p className="text-sm text-gray-500">Original</p>
              <p className="font-semibold text-gray-700">{formatSize(file.size)}</p>
            </div>
            <ArrowRight className="text-pink-400 w-6 h-6" />
            <div className="text-left">
              <p className="text-sm text-gray-500">New Size</p>
              <p className={`font-bold ${result.newSize < file.size ? 'text-green-600' : 'text-orange-500'}`}>
                {formatSize(result.newSize)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={result.url} 
              download={result.name}
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-5 h-5" /> Download {targetFormat.split('/')[1].toUpperCase()}
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Convert Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}