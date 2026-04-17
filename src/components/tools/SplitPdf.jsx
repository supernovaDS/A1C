import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FileUploader from '../shared/FileUploader';
import { parseRangeToSet } from '../../lib/rangeUtils'; // Reusing our utility!
import { Scissors, FileDown, Loader2, AlertTriangle, FileArchive, FilePlus2 } from 'lucide-react';

export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  
  const [mode, setMode] = useState('EXTRACT'); // 'EXTRACT' or 'BURST'
  const [rangeInput, setRangeInput] = useState('');
  
  const [isSplitting, setIsSplitting] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (files) => {
    try {
      const selectedFile = files[0];
      setFile(selectedFile);
      setResultUrl(null);
      setError(null);
      setRangeInput('');

      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadedPdf = await PDFDocument.load(arrayBuffer);
      
      setPdfDoc(loadedPdf);
      setTotalPages(loadedPdf.getPageCount());
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setError("Could not read the PDF. It might be encrypted or corrupted.");
      setFile(null);
    }
  };

  const handleSplit = async () => {
    setIsSplitting(true);
    setError(null);

    try {
      if (mode === 'EXTRACT') {
        await extractRange();
      } else {
        await burstPdf();
      }
    } catch (err) {
      console.error("Split error:", err);
      setError("An error occurred while splitting the document.");
    } finally {
      setIsSplitting(false);
    }
  };

  const extractRange = async () => {
    const selectedPagesSet = parseRangeToSet(rangeInput, totalPages);
    if (selectedPagesSet.size === 0) {
      throw new Error("Please enter a valid page range.");
    }

    const newPdf = await PDFDocument.create();
    const pagesToCopy = Array.from(selectedPagesSet)
      .sort((a, b) => a - b)
      .map(pageNum => pageNum - 1); // pdf-lib uses 0-based indexing

    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    setResultUrl(URL.createObjectURL(blob));
  };

  const burstPdf = async () => {
    const zip = new JSZip();
    const baseFilename = file.name.replace('.pdf', '');

    // Loop through every single page
    for (let i = 0; i < totalPages; i++) {
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
      singlePagePdf.addPage(copiedPage);
      
      const pdfBytes = await singlePagePdf.save();
      zip.file(`${baseFilename}_Page_${i + 1}.pdf`, pdfBytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    // For burst mode, we download immediately rather than showing a preview link
    saveAs(zipBlob, `${baseFilename}_Burst.zip`);
    setResultUrl('BURST_COMPLETE'); 
  };

  const resetTool = () => {
    setFile(null);
    setPdfDoc(null);
    setResultUrl(null);
    setRangeInput('');
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Scissors className="text-blue-500 transform -scale-x-100" /> Split PDF
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
              {/* File Info Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-medium text-gray-700 truncate">{file.name}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full shrink-0">
                  {totalPages} Pages
                </span>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('EXTRACT')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'EXTRACT' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <FilePlus2 className={`w-6 h-6 mb-2 ${mode === 'EXTRACT' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className="font-bold text-gray-800">Extract Pages</h3>
                  <p className="text-xs text-gray-500 mt-1">Create a new PDF with specific pages.</p>
                </button>
                
                <button
                  onClick={() => setMode('BURST')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${mode === 'BURST' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <FileArchive className={`w-6 h-6 mb-2 ${mode === 'BURST' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h3 className="font-bold text-gray-800">Burst to Single Pages</h3>
                  <p className="text-xs text-gray-500 mt-1">Extract all pages into a ZIP file.</p>
                </button>
              </div>

              {/* Dynamic Input Area */}
              <div className="p-4 border border-gray-200 rounded-xl bg-white">
                {mode === 'EXTRACT' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pages to Extract (e.g., 1-5, 8, 11-13)
                    </label>
                    <input 
                      type="text" 
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder={`1-${Math.min(5, totalPages)}`}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    This will create a ZIP archive containing <strong>{totalPages}</strong> individual PDF files.
                  </div>
                )}
              </div>

              <button 
                onClick={handleSplit}
                disabled={isSplitting || (mode === 'EXTRACT' && !rangeInput.trim())}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSplitting ? <Loader2 className="animate-spin w-6 h-6" /> : `Split PDF`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-2xl font-bold text-green-700 mb-2">Splitting Complete!</h3>
          <p className="text-green-600 mb-8">
            {resultUrl === 'BURST_COMPLETE' 
              ? "Your ZIP file has been successfully downloaded." 
              : "Your extracted pages have been compiled into a new PDF."}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {resultUrl !== 'BURST_COMPLETE' && (
              <a 
                href={resultUrl} 
                download={`Extracted_${file.name}`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FileDown className="w-5 h-5" /> Download PDF
              </a>
            )}
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Split Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}