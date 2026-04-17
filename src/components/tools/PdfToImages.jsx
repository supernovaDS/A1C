import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite-specific worker setup for PDF.js
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import FileUploader from '../shared/FileUploader';
import { parseRangeToSet, createRangeString } from '../../lib/rangeUtils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FileDown, Image as ImageIcon, Settings2, CheckSquare } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfToImages() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState([]); // { pageNum, dataUrl }
  
  // Sync States
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [rangeInput, setRangeInput] = useState("");
  
  // Options
  const [format, setFormat] = useState('image/jpeg');

  // 1. Handle File Upload & Load PDF
  const handleFileSelect = async (files) => {
    const file = files[0];
    setPdfFile(file);
    
    const arrayBuffer = await file.arrayBuffer();
    const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    setPdfDoc(loadedPdf);
    setTotalPages(loadedPdf.numPages);
    
    // Default: Select all pages
    const allPages = new Set(Array.from({length: loadedPdf.numPages}, (_, i) => i + 1));
    setSelectedPages(allPages);
    setRangeInput(createRangeString(allPages));
    
    // Kick off thumbnail generation (Low Res for UI)
    generateThumbnails(loadedPdf);
  };

  // 2. Generate Low-Res Thumbnails for the UI grid
  const generateThumbnails = async (pdf) => {
    const thumbs = [];
    // For large PDFs, you'd want to lazy load this using an IntersectionObserver.
    // For MVP, we render small thumbnails immediately.
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.5 }); // Low scale = faster render
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      thumbs.push({ pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.5) });
    }
    setThumbnails(thumbs);
  };

  // 3. Sync Logic: Visual Checkbox -> Text Input
  const togglePageSelection = (pageNum) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNum)) {
      newSelection.delete(pageNum);
    } else {
      newSelection.add(pageNum);
    }
    setSelectedPages(newSelection);
    setRangeInput(createRangeString(newSelection));
  };

  // 4. Sync Logic: Text Input -> Visual Checkboxes
  const handleRangeInputChange = (e) => {
    const val = e.target.value;
    setRangeInput(val);
    setSelectedPages(parseRangeToSet(val, totalPages));
  };

  // 5. Quick Select Actions
  const handleQuickSelect = (action) => {
    let newSelection = new Set();
    if (action === 'ALL') {
      newSelection = new Set(Array.from({length: totalPages}, (_, i) => i + 1));
    } else if (action === 'EVEN') {
      newSelection = new Set(Array.from({length: totalPages}, (_, i) => i + 1).filter(n => n % 2 === 0));
    } else if (action === 'ODD') {
      newSelection = new Set(Array.from({length: totalPages}, (_, i) => i + 1).filter(n => n % 2 !== 0));
    } // NONE leaves it empty
    
    setSelectedPages(newSelection);
    setRangeInput(createRangeString(newSelection));
  };

  // 6. High-Res Conversion & ZIP Download
  const convertAndDownload = async () => {
    if (selectedPages.size === 0) return alert("Select at least one page.");
    
    const zip = new JSZip();
    const sortedPages = Array.from(selectedPages).sort((a,b) => a-b);
    
    for (const pageNum of sortedPages) {
      const page = await pdfDoc.getPage(pageNum);
      // High scale for actual output (e.g., 2.0 or 3.0)
      const viewport = page.getViewport({ scale: 2.0 }); 
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport }).promise;
      
      // Convert canvas to Blob for ZIP
      const blob = await new Promise(resolve => canvas.toBlob(resolve, format, 0.9));
      const ext = format === 'image/jpeg' ? 'jpg' : 'png';
      zip.file(`Page_${pageNum}.${ext}`, blob);
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${pdfFile.name.split('.')[0]}_Images.zip`);
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ImageIcon className="text-blue-500" /> PDF to Images
      </h2>

      {!pdfDoc ? (
        <FileUploader onFilesSelected={handleFileSelect} accept={{ 'application/pdf': ['.pdf'] }} maxFiles={1} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT PANEL: Settings & Extraction */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4" /> Output Settings
              </h3>
              
              <label className="block text-sm text-gray-600 mb-2">Image Format</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg mb-4 text-sm"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="image/jpeg">JPG (Smaller file)</option>
                <option value="image/png">PNG (Higher quality)</option>
              </select>

              <label className="block text-sm text-gray-600 mb-2">Select Pages (e.g., 1-5, 8)</label>
              <input 
                type="text" 
                value={rangeInput}
                onChange={handleRangeInputChange}
                placeholder="1-5, 8, 11-13"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-4"
              />

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => handleQuickSelect('ALL')} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 py-1.5 rounded">Select All</button>
                <button onClick={() => handleQuickSelect('NONE')} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 py-1.5 rounded">Clear All</button>
                <button onClick={() => handleQuickSelect('EVEN')} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 py-1.5 rounded">Even Pages</button>
                <button onClick={() => handleQuickSelect('ODD')} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 py-1.5 rounded">Odd Pages</button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {selectedPages.size} / {totalPages} pages selected
                </p>
                <button 
                  onClick={convertAndDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <FileDown className="w-4 h-4" /> Extract to ZIP
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Visual Grid */}
          <div className="lg:col-span-3">
             {/* Using a highly responsive grid to avoid mobile layout breaking */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto p-2">
              {thumbnails.map((thumb) => {
                const isSelected = selectedPages.has(thumb.pageNum);
                return (
                  <div 
                    key={thumb.pageNum}
                    onClick={() => togglePageSelection(thumb.pageNum)}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all group overflow-hidden ${isSelected ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="aspect-[1/1.4] bg-gray-100 w-full relative">
                      <img src={thumb.dataUrl} alt={`Page ${thumb.pageNum}`} className="w-full h-full object-contain" />
                      
                      {/* Visual Selection Overlay */}
                      <div className={`absolute inset-0 bg-blue-500/10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                    </div>
                    
                    {/* Bottom Bar: Checkbox & Page Number */}
                    <div className={`flex items-center justify-between p-2 bg-white border-t ${isSelected ? 'border-blue-500' : 'border-gray-200'}`}>
                      <span className="text-xs font-semibold text-gray-600">Page {thumb.pageNum}</span>
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                        {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}