import React, { useState } from 'react';
import FileUploader from '../shared/FileUploader';
import { Unlock, Download, Loader2, AlertTriangle, Key } from 'lucide-react';

export default function UnlockPdf() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (files) => {
    setFile(files[0]);
    setResultUrl(null);
    setError(null);
    setPassword('');
  };

  const handleUnlock = async () => {
    if (!file) return;
    if (!password.trim()) {
      setError("Please enter the password to unlock this file.");
      return;
    }
    
    setIsUnlocking(true);
    setError(null);

    try {
      const token = import.meta.env.VITE_CONVERTAPI_TOKEN;
      if (!token) throw new Error("API Token is missing. Check your .env file.");

      const formData = new FormData();
      formData.append('File', file);
      formData.append('Password', password); // Pass the password to the API

      // Use the dedicated decrypt endpoint
      const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/decrypt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // ConvertAPI is smart enough to tell us if the password was specifically wrong
        if (data.Message && data.Message.toLowerCase().includes('password')) {
          throw new Error("Incorrect password. Please check and try again.");
        }
        throw new Error(data.Message || "Failed to unlock document.");
      }

      // Reconstruct the clean PDF from the API response
      const fileData = data.Files[0].FileData;
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      setResultUrl(url);

    } catch (err) {
      console.error("Unlock error:", err);
      setError(err.message);
    } finally {
      setIsUnlocking(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setPassword('');
    setResultUrl(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Unlock className="text-green-500" /> Unlock PDF
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
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
                <span className="font-medium text-gray-700 truncate w-full sm:w-auto">{file.name}</span>
                <span className="text-sm text-gray-500 shrink-0">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Enter Document Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  We need the current password to permanently remove the security from this file.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={resetTool}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUnlock}
                  disabled={isUnlocking || !password.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUnlocking ? <Loader2 className="animate-spin w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  Remove Password
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Document Unlocked!</h3>
          <p className="text-green-600 mb-8">The password has been permanently removed from your PDF.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={resultUrl} 
              download={`Unlocked_${file.name}`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download Unlocked PDF
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Unlock Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}