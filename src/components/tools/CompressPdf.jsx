import React, { useState } from 'react';
import FileUploader from '../shared/FileUploader';
import { Minimize2, Download, Loader2, AlertTriangle, ArrowDown, Settings } from 'lucide-react';

export default function CompressPdf() {
  const [file, setFile] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState(50); // Default 50%
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (files) => {
    setFile(files[0]);
    setResult(null); 
    setError(null);
  };

  const formatSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const expectedSize = file ? file.size * (1 - compressionLevel / 100) : 0;

  const compressPdf = async () => {
    if (!file) return;
    setIsCompressing(true);
    setError(null);

    try {
      const token = import.meta.env.VITE_CONVERTAPI_TOKEN;
      const formData = new FormData();
      formData.append('File', file);
      
      // Mapping slider % to API ImageQuality (Inverse relationship often works best)
      // High compression (90%) = Low Image Quality (10)
      const quality = 100 - compressionLevel;

      const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/compress?ImageQuality=${quality}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.Message || "Failed to compress.");

      const fileData = data.Files[0].FileData;
      const newSizeBytes = data.Files[0].FileSize;
      
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const url = URL.createObjectURL(new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' }));
      
      setResult({ url, originalSize: file.size, newSize: newSizeBytes });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Minimize2 className="text-orange-500" /> Compress PDF
      </h2>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {!result ? (
        <>
          <FileUploader onFilesSelected={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} maxFiles={1} />
          
          {file && (
            <div className="mt-8 space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Compression Level
                  </h3>
                  <span className="text-orange-600 font-bold">{compressionLevel}%</span>
                </div>
                
                <input 
                  type="range" min="10" max="90" step="10"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4"
                />
                
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <div className="text-center">
                    <p>Low Compression</p>
                    <p>(High Quality)</p>
                  </div>
                  <div className="text-center">
                    <p>High Compression</p>
                    <p>(Low Quality)</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-blue-50/50 rounded-lg border border-blue-100 gap-4">
                <div className="flex flex-col truncate w-full">
                  <span className="text-sm text-gray-500">Estimated Output Size:</span>
                  <span className="font-bold text-blue-700 text-lg">~{formatSize(expectedSize)}</span>
                </div>
                <button 
                  onClick={compressPdf} disabled={isCompressing}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isCompressing ? <Loader2 className="animate-spin w-5 h-5" /> : 'Compress Now'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-xl font-bold text-green-700 mb-6">File Compressed!</h3>
          <div className="flex justify-center items-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Original</p>
              <p className="font-semibold text-gray-700 line-through">{formatSize(result.originalSize)}</p>
            </div>
            <div className="flex flex-col items-center text-green-600">
              <ArrowDown className="w-6 h-6" />
              <span className="font-bold">Result: {formatSize(result.newSize)}</span>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <a href={result.url} download={`Compressed_${file.name}`} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"><Download className="w-5 h-5" /> Download</a>
            <button onClick={() => { setFile(null); setResult(null); }} className="bg-white border border-gray-200 px-6 py-3 rounded-lg font-medium">Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}