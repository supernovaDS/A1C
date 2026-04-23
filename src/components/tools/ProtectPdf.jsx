import React, { useState } from 'react';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import FileUploader from '../shared/FileUploader';
import { Lock, Download, Loader2, AlertTriangle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ProtectPdf() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (files) => {
    setFile(files[0]);
    setResultUrl(null);
    setError(null);
  };

  const passwordsMatch = password.trim() && confirmPassword.trim() && password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleProtect = async () => {
    if (!file) return;
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    
    setIsEncrypting(true);
    setError(null);

    try {
      const fileBytes = await file.arrayBuffer();
      
      // The lite library requires a Uint8Array and the password string
      const encryptedBytes = await encryptPDF(new Uint8Array(fileBytes), password);
      
      const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Encryption error:", err);
      setError("Failed to encrypt the document. Ensure it isn't already password-protected.");
    } finally {
      setIsEncrypting(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setResultUrl(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Lock className="text-red-500" /> Protect PDF
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

              <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-5">
                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Document Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password..."
                      className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password..."
                      className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 outline-none transition-all ${
                        showMismatch 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                      }`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {showMismatch && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">
                      Passwords do not match
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-green-600 mt-1.5 font-medium">
                      ✓ Passwords match
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Anyone who opens this PDF will be required to enter this exact password.
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
                  onClick={handleProtect}
                  disabled={isEncrypting || !passwordsMatch}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEncrypting ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  Encrypt & Protect
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Document Protected!</h3>
          <p className="text-green-600 mb-8">Your PDF is now securely locked with a password.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={resultUrl} 
              download={`Protected_${file.name}`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download Protected PDF
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Protect Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}