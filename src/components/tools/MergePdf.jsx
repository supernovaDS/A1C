import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import FileUploader from '../shared/FileUploader';
import { Layers, Download, Loader2, X, GripVertical, AlertTriangle } from 'lucide-react';

export default function MergePdf() {
  const [files, setFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  // Maximum allowed total size (e.g., 50MB) to prevent browser crashes
  const MAX_TOTAL_SIZE_MB = 50;

  const handleFileSelect = (newFiles) => {
    setError(null);
    setMergedPdfUrl(null);

    // Map new files to objects with stable unique IDs
    const newFileObjects = newFiles.map(file => ({
      id: crypto.randomUUID(), // Stable key for Drag and Drop
      file: file,
      name: file.name,
      size: file.size
    }));

    setFiles(prev => {
      const combined = [...prev, ...newFileObjects];
      const totalSizeMB = combined.reduce((acc, curr) => acc + curr.size, 0) / (1024 * 1024);
      
      if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
        setError(`Total file size exceeds ${MAX_TOTAL_SIZE_MB}MB limit. Please remove some files.`);
      }
      return combined;
    });
  };

  const removeFile = (idToRemove) => {
    setFiles(prev => prev.filter(f => f.id !== idToRemove));
    setError(null);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(files);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFiles(items);
  };

  const formatSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setIsMerging(true);
    setError(null);

    try {
      // Create a blank document to hold the merged pages
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        try {
          const fileBytes = await files[i].file.arrayBuffer();
          const pdfToMerge = await PDFDocument.load(fileBytes);
          
          // Copy all pages from the current PDF
          const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          
          // Append them sequentially
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        } catch (err) {
          console.error(`Failed to process ${files[i].name}:`, err);
          // If a file is encrypted or corrupted, warn the user but continue merging
          alert(`Skipping "${files[i].name}" - it may be corrupted or password protected.`);
        }
      }

      // Serialize and create download link
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setMergedPdfUrl(url);
    } catch (err) {
      console.error("Merge failed:", err);
      setError("An unexpected error occurred during merging.");
    } finally {
      setIsMerging(false);
    }
  };

  const resetTool = () => {
    setFiles([]);
    setMergedPdfUrl(null);
    setError(null);
  };

  const totalSizeMB = files.reduce((acc, curr) => acc + curr.size, 0) / (1024 * 1024);
  const isOverSizeLimit = totalSizeMB > MAX_TOTAL_SIZE_MB;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Layers className="text-blue-500" /> Merge PDFs
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!mergedPdfUrl ? (
        <>
          <FileUploader 
            onFilesSelected={handleFileSelect} 
            accept={{ 'application/pdf': ['.pdf'] }} 
            maxFiles={0} 
          />
          
          {files.length > 0 && (
            <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">
                  Arrange Files ({files.length})
                </h3>
                <span className={`text-sm font-medium ${isOverSizeLimit ? 'text-red-600' : 'text-gray-500'}`}>
                  Total: {totalSizeMB.toFixed(2)} MB / {MAX_TOTAL_SIZE_MB} MB
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">Drag and drop to reorder. Files will be merged from top to bottom.</p>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="pdf-list">
                  {(provided) => (
                    <ul 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-2 mb-6"
                    >
                      {files.map((fileObj, index) => (
                        <Draggable key={fileObj.id} draggableId={fileObj.id} index={index}>
                          {(provided, snapshot) => (
                            <li 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between p-3 bg-white rounded-lg border transition-shadow
                                ${snapshot.isDragging ? 'shadow-md border-blue-400 z-10' : 'border-gray-200 hover:border-blue-200'}`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {/* Drag Handle */}
                                <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col truncate">
                                  <span className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                    <span className="text-gray-400 mr-2">{index + 1}.</span> 
                                    {fileObj.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatSize(fileObj.size)}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => removeFile(fileObj.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-md transition-all shrink-0"
                                aria-label="Remove file"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>

              <button 
                onClick={mergePdfs}
                disabled={isMerging || files.length < 2 || isOverSizeLimit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMerging ? <Loader2 className="animate-spin w-6 h-6" /> : 'Merge PDFs Now'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-xl sm:text-2xl font-bold text-green-700 mb-2">Merge Complete!</h3>
          <p className="text-green-600 mb-6">Combined {files.length} documents successfully.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={mergedPdfUrl} 
              download={`Merged_Document_${new Date().getTime()}.pdf`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download Merged PDF
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Merge More Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}