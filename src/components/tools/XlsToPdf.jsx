import React, { useState } from 'react';
import FileUploader from '../shared/FileUploader';
import { FileSpreadsheet, Download, Loader2, AlertTriangle } from 'lucide-react';

export default function ExcelToPdf() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (files) => {
    setFile(files[0]);
    setResultUrl(null); 
    setError(null);
  };

  const convertExcel = async () => {
    if (!file) return;
    setIsConverting(true);
    setError(null);

    try {
      const token = import.meta.env.VITE_CONVERTAPI_TOKEN;
      if (!token) throw new Error("API Token is missing. Check your .env file.");

      // Extract extension (xls or xlsx) to dynamically route the API
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (fileExt !== 'xls' && fileExt !== 'xlsx') {
        throw new Error("Invalid file type. Please upload an XLS or XLSX file.");
      }

      const formData = new FormData();
      formData.append('File', file);
      // For Excel, it's often helpful to fit everything on one page wide
      formData.append('FitToPage', 'true'); 

      const response = await fetch(`https://v2.convertapi.com/convert/${fileExt}/to/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.Message || "Failed to convert spreadsheet.");
      }

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
      console.error("API Conversion Error:", err);
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FileSpreadsheet className="text-green-600" />
        Excel to PDF
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!resultUrl ? (
        <>
          <FileUploader 
            onFilesSelected={handleFileSelect} 
            accept={{ 
              'application/vnd.ms-excel': ['.xls'],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
            }} 
            maxFiles={1}
          />
          
          {file && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
              <div className="flex flex-col truncate w-full sm:w-auto">
                <span className="font-medium text-gray-700 truncate">{file.name}</span>
                <span className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button 
                onClick={convertExcel}
                disabled={isConverting}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shrink-0"
              >
                {isConverting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Convert Spreadsheet'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-xl font-bold text-green-700 mb-4">Spreadsheet Converted!</h3>
          <p className="text-green-600 mb-6">Your Excel file has been cleanly formatted into a PDF.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={resultUrl} 
              download={`${file.name.split('.')[0]}.pdf`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download PDF
            </a>
            <button 
              onClick={() => { setFile(null); setResultUrl(null); }}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Convert Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}