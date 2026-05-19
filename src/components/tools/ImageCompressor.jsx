import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FileUploader from '../shared/FileUploader';
import { Minimize2, Download, Loader2, AlertTriangle, ArrowRight, X, FileArchive, Info, Settings } from 'lucide-react';

export default function ImageCompressor() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState('');
  
  const [isCompressing, setIsCompressing] = useState(false);
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

  const compressSingleImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;

          // Handle resizing if maxWidth is set
          const parsedMaxWidth = parseInt(maxWidth, 10);
          if (!isNaN(parsedMaxWidth) && parsedMaxWidth > 0 && targetWidth > parsedMaxWidth) {
            const ratio = parsedMaxWidth / targetWidth;
            targetWidth = parsedMaxWidth;
            targetHeight = img.height * ratio;
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          // Determine target format
          // If original is PNG, we convert to WEBP to actually achieve compression
          let targetFormat = file.type;
          if (file.type === 'image/png') {
            targetFormat = 'image/webp'; // WebP supports transparency and compression
          } else if (file.type !== 'image/jpeg' && file.type !== 'image/webp') {
             targetFormat = 'image/jpeg';
          }

          if (targetFormat === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Apply some smoothing for better quality when resizing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error(`Failed to compress ${file.name}`));
                return;
              }
              
              const url = URL.createObjectURL(blob);
              const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const ext = targetFormat.split('/')[1]; 
              const newFileName = `${originalName}_compressed.${ext}`;

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
            quality
          );
        };
        img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
        img.src = event.target.result;
      };
      
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const compressAll = async () => {
    if (files.length === 0) return;
    setIsCompressing(true);
    setError(null);
    setProgress(0);

    try {
      const compressedResults = [];
      for (let i = 0; i < files.length; i++) {
        const result = await compressSingleImage(files[i]);
        compressedResults.push(result);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setResults(compressedResults);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadAll = async () => {
    if (results.length === 1) {
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
    saveAs(zipBlob, 'compressed_images.zip');
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

  const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalNewSize = results.reduce((acc, r) => acc + r.newSize, 0);
  const hasPngFiles = files.some(f => f.type === 'image/png');

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
            <Minimize2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Image Compressor</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Reduce image file sizes instantly without losing visible quality.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {results.length === 0 ? (
        <div className="space-y-8">
          <FileUploader 
            onFilesSelected={handleFileSelect} 
            accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }} 
            maxFiles={50}
          />
          
          {files.length > 0 && (
            <div className="space-y-6 animate-fade-in-up">
              
              {/* File List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">{files.length} file{files.length !== 1 ? 's' : ''} ready</span>
                  <span className="text-sm font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">Total: {formatSize(totalOriginalSize)}</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-600">
                        <Minimize2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatSize(file.size)} • {file.type.split('/')[1].toUpperCase()}</p>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings Panel */}
              <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold text-slate-800">Compression Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-slate-700">Compression Level</label>
                      <span className="text-sm text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{Math.round((1 - quality) * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" max="0.9" step="0.1"
                      value={1 - quality} // Invert so sliding right means more compression
                      onChange={(e) => setQuality(1 - parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 font-medium mt-2">
                      <span>Lighter (Higher Quality)</span>
                      <span>Stronger (Smaller Size)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Max Width (Optional)
                    </label>
                    <div className="relative">
                        <input 
                            type="number" 
                            placeholder="e.g., 1920"
                            value={maxWidth}
                            onChange={(e) => setMaxWidth(e.target.value)}
                            className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 transition-shadow"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">px</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Leave empty to keep original dimensions.</p>
                  </div>
                </div>

                {hasPngFiles && (
                  <div className="flex items-start gap-2 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>PNGs detected:</strong> To achieve optimal compression, PNG files will be automatically converted to <strong>WebP</strong> format, which supports transparency and smaller file sizes.
                    </p>
                  </div>
                )}
              </div>

              {/* Convert Button */}
              <button 
                onClick={compressAll}
                disabled={isCompressing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="animate-spin w-6 h-6" />
                    Compressing... {progress}%
                  </>
                ) : (
                  `Compress ${files.length} Image${files.length !== 1 ? 's' : ''}`
                )}
              </button>

              {isCompressing && (
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300 relative"
                    style={{ width: `${progress}%` }}
                  >
                     <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in-up">
          <div className="text-center py-8 px-6 bg-emerald-50 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-200/50 rounded-full blur-2xl"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-200/50 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
                    <Minimize2 className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-extrabold text-emerald-800 mb-3 tracking-tight">Compression Complete!</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-emerald-700 font-medium">
                    <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-emerald-200/50">
                        <span className="text-slate-500">Original:</span>
                        <span className="font-bold text-slate-800">{formatSize(totalOriginalSize)}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 hidden sm:block text-emerald-400" />
                    <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-sm">
                        <span>New Size:</span>
                        <span className="font-bold">{formatSize(totalNewSize)}</span>
                    </div>
                </div>
                <div className="mt-4 inline-block bg-emerald-100/80 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full">
                    Saved {Math.round((1 - totalNewSize / totalOriginalSize) * 100)}% space
                </div>
            </div>
          </div>
          
          {/* Results Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {results.map((result, index) => {
                 const savings = Math.round((1 - result.newSize / result.originalSize) * 100);
                 const isSmaller = result.newSize < result.originalSize;
                 
                 return (
                <div key={index} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                     <img src={result.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate mb-1">{result.originalName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 line-through">{formatSize(result.originalSize)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isSmaller ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {formatSize(result.newSize)}
                      </span>
                      {isSmaller && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">-{savings}%</span>
                      )}
                    </div>
                  </div>
                  <a 
                    href={result.url} 
                    download={result.name}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all shadow-sm"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )})}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <button 
              onClick={downloadAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FileArchive className="w-5 h-5" />
              {results.length > 1 ? 'Download All (ZIP)' : `Download Image`}
            </button>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold transition-all"
            >
              Compress More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
