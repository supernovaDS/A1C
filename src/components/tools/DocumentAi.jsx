import React, { useState } from 'react';
import FileUploader from '../shared/FileUploader';
import { BrainCircuit, Copy, CheckCheck, Loader2, AlertTriangle, FileText, AlignLeft } from 'lucide-react';

export default function DocumentAi() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('EXTRACT'); // 'EXTRACT' or 'SUMMARIZE'
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (files) => {
    setFile(files[0]);
    setResultText('');
    setError(null);
  };

  const processDocument = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setResultText('');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key is missing. Check your .env file.");

      // 1. Convert file to Base64 for the API
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
      });

      // 2. Determine the prompt based on the user's selected mode
      const prompt = mode === 'EXTRACT' 
        ? "Extract all the text from this document exactly as it appears. Preserve formatting, lists, and paragraphs. Do not add any conversational filler, just return the extracted text."
        : "Analyze this document and provide a comprehensive but concise summary. Use bullet points for key takeaways.";

      // 3. Call the Gemini Vision-Native Engine
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              }
            ]
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to analyze document.");
      }

      // 4. Extract and set the response text
      const extractedText = data.candidates[0]?.content?.parts[0]?.text || "No text could be extracted.";
      setResultText(extractedText);

    } catch (err) {
      console.error("AI Processing Error:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BrainCircuit className="text-indigo-500" /> Document Intelligence
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload and Controls */}
        <div className="space-y-6">
          <FileUploader 
            onFilesSelected={handleFileSelect} 
            accept={{ 
              'application/pdf': ['.pdf'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
              'image/webp': ['.webp']
            }} 
            maxFiles={1}
          />
          
          {file && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-medium text-gray-700 truncate block mb-4">{file.name}</span>
                
                <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setMode('EXTRACT')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${mode === 'EXTRACT' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <AlignLeft className="w-4 h-4" /> OCR Extract
                  </button>
                  <div className="w-px bg-gray-300"></div>
                  <button
                    onClick={() => setMode('SUMMARIZE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${mode === 'SUMMARIZE' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <FileText className="w-4 h-4" /> Summarize
                  </button>
                </div>
              </div>

              <button 
                onClick={processDocument}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : 'Run Analysis'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Output Area */}
        <div className="h-full min-h-[400px] flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative">
          <div className="bg-gray-100 border-b border-gray-200 p-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Output Result</span>
            {resultText && (
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-sm font-medium text-gray-700 transition-colors"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            )}
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center text-indigo-500 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-medium animate-pulse">Analyzing document structure...</p>
              </div>
            ) : resultText ? (
              <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                {resultText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BrainCircuit className="w-12 h-12 mb-2 opacity-20" />
                <p>Upload a document to extract text or summarize.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}