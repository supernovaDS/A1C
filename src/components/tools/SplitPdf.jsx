import React, { useState, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FileUploader from '../shared/FileUploader';
import { parseRangeToSet, createRangeString } from '../../lib/rangeUtils';
import { Scissors, FileDown, Loader2, AlertTriangle, FileArchive, FilePlus2, CheckSquare, Square } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);   // pdf-lib doc (for splitting)
  const [pdfjsDoc, setPdfjsDoc] = useState(null); // pdfjs doc (for thumbnails)
  const [totalPages, setTotalPages] = useState(0);
  
  const [mode, setMode] = useState('EXTRACT');
  const [rangeInput, setRangeInput] = useState('');
  const [selectedPages, setSelectedPages] = useState(new Set());
  
  // Thumbnails
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);

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
      setSelectedPages(new Set());
      setThumbnails([]);

      const arrayBuffer = await selectedFile.arrayBuffer();

      // Load with pdf-lib for splitting operations
      const loadedPdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(loadedPdf);
      const pageCount = loadedPdf.getPageCount();
      setTotalPages(pageCount);

      // Load with pdfjs-dist for thumbnail rendering (need a fresh copy of the buffer)
      const arrayBuffer2 = await selectedFile.arrayBuffer();
      const pdfjsPdf = await pdfjsLib.getDocument({ data: arrayBuffer2 }).promise;
      setPdfjsDoc(pdfjsPdf);

      // Generate thumbnails immediately
      generateThumbnails(pdfjsPdf, pageCount);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setError("Could not read the PDF. It might be encrypted or corrupted.");
      setFile(null);
    }
  };

  // Generate thumbnails using pdfjs-dist
  const generateThumbnails = async (pdf, pageCount) => {
    setIsLoadingThumbs(true);
    try {
      const thumbs = [];
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push({ pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.5) });
      }
      setThumbnails(thumbs);
    } catch (err) {
      console.error("Thumbnail generation error:", err);
    } finally {
      setIsLoadingThumbs(false);
    }
  };

  // Sync range input → selected pages
  const handleRangeInputChange = (value) => {
    setRangeInput(value);
    const newSet = parseRangeToSet(value, totalPages);
    setSelectedPages(newSet);
  };

  // Toggle a page in selection → update range input
  const togglePage = (pageNum) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNum)) {
        newSet.delete(pageNum);
      } else {
        newSet.add(pageNum);
      }
      setRangeInput(createRangeString(newSet));
      return newSet;
    });
  };

  const selectAll = () => {
    const allPages = new Set();
    for (let i = 1; i <= totalPages; i++) allPages.add(i);
    setSelectedPages(allPages);
    setRangeInput(createRangeString(allPages));
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
    setRangeInput('');
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
      setError(err.message || "An error occurred while splitting the document.");
    } finally {
      setIsSplitting(false);
    }
  };

  const extractRange = async () => {
    if (selectedPages.size === 0) {
      throw new Error("Please select at least one page.");
    }

    const newPdf = await PDFDocument.create();
    const pagesToCopy = Array.from(selectedPages)
      .sort((a, b) => a - b)
      .map(pageNum => pageNum - 1);

    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    setResultUrl(URL.createObjectURL(blob));
  };

  const burstPdf = async () => {
    const zip = new JSZip();
    const baseFilename = file.name.replace('.pdf', '');

    for (let i = 0; i < totalPages; i++) {
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
      singlePagePdf.addPage(copiedPage);
      
      const pdfBytes = await singlePagePdf.save();
      zip.file(`${baseFilename}_Page_${i + 1}.pdf`, pdfBytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${baseFilename}_Burst.zip`);
    setResultUrl('BURST_COMPLETE'); 
  };

  const resetTool = () => {
    setFile(null);
    setPdfDoc(null);
    setPdfjsDoc(null);
    setResultUrl(null);
    setRangeInput('');
    setSelectedPages(new Set());
    setThumbnails([]);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
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
                  <div className="space-y-4">
                    {/* Text Range Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pages to Extract (e.g., 1-5, 8, 11-13)
                      </label>
                      <input 
                        type="text" 
                        value={rangeInput}
                        onChange={(e) => handleRangeInputChange(e.target.value)}
                        placeholder={`1-${Math.min(5, totalPages)}`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    {/* Select All / Deselect All */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={selectAll}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" /> Select All
                      </button>
                      <button 
                        onClick={deselectAll}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        <Square className="w-4 h-4" /> Deselect All
                      </button>
                      {selectedPages.size > 0 && (
                        <span className="text-sm text-blue-600 font-semibold ml-auto">
                          {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>

                    {/* Page Thumbnails Grid */}
                    {isLoadingThumbs ? (
                      <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span className="text-sm">Generating page previews...</span>
                      </div>
                    ) : thumbnails.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[480px] overflow-y-auto p-1">
                        {thumbnails.map((thumb) => {
                          const isSelected = selectedPages.has(thumb.pageNum);
                          return (
                            <div
                              key={thumb.pageNum}
                              onClick={() => togglePage(thumb.pageNum)}
                              className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all group ${
                                isSelected 
                                  ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                              }`}
                            >
                              {/* Thumbnail image */}
                              <div className="aspect-[1/1.4] bg-gray-100 w-full relative">
                                <img 
                                  src={thumb.dataUrl} 
                                  alt={`Page ${thumb.pageNum}`} 
                                  className="w-full h-full object-contain"
                                />
                                {/* Selection overlay */}
                                <div className={`absolute inset-0 bg-blue-500/10 transition-opacity ${
                                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                }`} />
                              </div>
                              
                              {/* Bottom bar: checkbox + page number */}
                              <div className={`flex items-center justify-between p-2 bg-white border-t ${
                                isSelected ? 'border-blue-500' : 'border-gray-200'
                              }`}>
                                <span className="text-xs font-semibold text-gray-600">Page {thumb.pageNum}</span>
                                <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white border-2 border-gray-300 group-hover:border-blue-400'
                                }`}>
                                  {isSelected && '✓'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    This will create a ZIP archive containing <strong>{totalPages}</strong> individual PDF files.
                  </div>
                )}
              </div>

              <button 
                onClick={handleSplit}
                disabled={isSplitting || (mode === 'EXTRACT' && selectedPages.size === 0)}
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