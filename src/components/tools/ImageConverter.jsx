import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FileUploader from '../shared/FileUploader';
import { ImageIcon, Download, Loader2, AlertTriangle, Settings, ArrowRight, X, FileArchive, Info } from 'lucide-react';

export default function ImageConverter() {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [quality, setQuality] = useState(0.8);
  
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    setResults([]);
    setError(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertSingleImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (targetFormat === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error(`Failed to convert ${file.name}`));
                return;
              }
              
              const url = URL.createObjectURL(blob);
              const originalName = file.name.split('.')[0];
              const ext = targetFormat.split('/')[1]; 
              const newFileName = `${originalName}.${ext}`;

              resolve({
                url,
                name: newFileName,
                originalName: file.name,
                originalSize: file.size,
                newSize: blob.size,
                blob
              });
            },
            targetFormat,
            targetFormat === 'image/png' ? undefined : quality
          );
        };
        img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
        img.src = event.target.result;
      };
      
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const convertAll = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    setError(null);
    setProgress(0);

    try {
      const convertedResults = [];
      for (let i = 0; i < files.length; i++) {
        const result = await convertSingleImage(files[i]);
        convertedResults.push(result);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setResults(convertedResults);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadAll = async () => {
    if (results.length === 1) {
      // Single file: download directly
      const a = document.createElement('a');
      a.href = results[0].url;
      a.download = results[0].name;
      a.click();
      return;
    }

    const zip = new JSZip();
    for (const result of results) {
      const response = await fetch(result.url);
      const blob = await response.blob();
      zip.file(result.name, blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'converted_images.zip');
  };

  const resetTool = () => {
    results.forEach(r => URL.revokeObjectURL(r.url));
    setFiles([]);
    setResults([]);
    setError(null);
    setProgress(0);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getEstimatedSize = (fileSize) => {
    if (targetFormat === 'image/png') return 'Lossless — varies';
    return '~' + formatSize(fileSize * quality);
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalNewSize = results.reduce((acc, r) => acc + r.newSize, 0);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ImageIcon className="text-blue-500" /> Image Converter
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {results.length === 0 ? (
        <>
          <FileUploader 
            onFilesSelected={handleFileSelect} 
            accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }} 
            maxFiles={50}
          />
          
          {files.length > 0 && (
            <div className="mt-8 space-y-6">
              
              {/* File List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
                  <span className="text-sm text-gray-500">Total: {formatSize(totalOriginalSize)}</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">{formatSize(file.size)}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-blue-600 font-medium">{getEstimatedSize(file.size)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings Panel */}
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Convert To
                    </label>
                    <select 
                      value={targetFormat}
                      onChange={(e) => setTargetFormat(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
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
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                      />
                    </div>
                  )}
                </div>

                {targetFormat !== 'image/png' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Estimated total output: <strong>{formatSize(totalOriginalSize * quality)}</strong> (actual size may vary based on image content)
                    </p>
                  </div>
                )}
              </div>

              {/* Convert Button */}
              <button 
                onClick={convertAll}
                disabled={isConverting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    Converting... {progress}%
                  </>
                ) : (
                  `Convert ${files.length} Image${files.length !== 1 ? 's' : ''}`
                )}
              </button>

              {isConverting && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-6 px-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-2xl font-bold text-blue-700 mb-2">Conversion Complete!</h3>
            <p className="text-blue-600">
              {results.length} image{results.length !== 1 ? 's' : ''} converted — Total: {formatSize(totalOriginalSize)} → <strong>{formatSize(totalNewSize)}</strong>
            </p>
          </div>
          
          {/* Results Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{result.originalName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{formatSize(result.originalSize)}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className={`text-xs font-semibold ${result.newSize < result.originalSize ? 'text-green-600' : 'text-orange-500'}`}>
                        {formatSize(result.newSize)}
                      </span>
                    </div>
                  </div>
                  <a 
                    href={result.url} 
                    download={result.name}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={downloadAll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <FileArchive className="w-5 h-5" />
              {results.length > 1 ? 'Download All (ZIP)' : `Download ${targetFormat.split('/')[1].toUpperCase()}`}
            </button>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Convert More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
