import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import FileUploader from '../shared/FileUploader';
import { FileImage, Download, Loader2, X, Plus, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SEO from '../SEO';

export default function ImageToPdf() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [outputName, setOutputName] = useState('Combined_Images');

  const allUrlsRef = React.useRef(new Set());

  // Clean up memory leaks only when the component unmounts
  useEffect(() => {
    return () => {
      allUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileSelect = async (newFiles) => {
    setIsUploading(true);
    setPdfUrl(null); 
    
    // Artificial delay to make upload loader visible and feel substantial
    await new Promise(resolve => setTimeout(resolve, 800));

    // Wrap the raw File object with a temporary URL for the image preview
    const filesWithPreviews = newFiles.map(file => {
      const preview = URL.createObjectURL(file);
      allUrlsRef.current.add(preview);
      return {
        id: crypto.randomUUID(),
        rawFile: file,
        preview
      };
    });
    
    setFiles((prev) => [...prev, ...filesWithPreviews]);
    setIsUploading(false);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => {
      // Revoke the URL to free up browser memory before removing
      const url = prev[indexToRemove].preview;
      URL.revokeObjectURL(url);
      allUrlsRef.current.delete(url);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const moveFile = (index, direction) => {
    setFiles((prev) => {
      const nextFiles = [...prev];
      const targetIndex = index + direction;
      
      if (targetIndex < 0 || targetIndex >= nextFiles.length) {
        return prev;
      }
      
      // Swap elements
      const temp = nextFiles[index];
      nextFiles[index] = nextFiles[targetIndex];
      nextFiles[targetIndex] = temp;
      
      return nextFiles;
    });
    setPdfUrl(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    setFiles((prev) => {
      const items = [...prev];
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      return items;
    });
    setPdfUrl(null);
  };

  const convertToPdf = async () => {
    if (files.length === 0) return;
    setIsConverting(true);

    try {
      const pdfDoc = await PDFDocument.create();
      
      // Standard A4 Dimensions in points (72 points per inch)
      const A4_WIDTH = 595.28;
      const A4_HEIGHT = 841.89;
      
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        const imageBytes = await fileObj.rawFile.arrayBuffer();
        
        let image;
        if (fileObj.rawFile.type === 'image/jpeg' || fileObj.rawFile.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (fileObj.rawFile.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue; 
        }

        const { width: imgWidth, height: imgHeight } = image.scale(1);
        
        // Add a standard A4 page
        const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

        // Calculate aspect ratio to fit the image entirely within the A4 page
        // (Adding a small 20pt margin padding so it doesn't touch the exact edges)
        const margin = 20;
        const maxWidth = A4_WIDTH - (margin * 2);
        const maxHeight = A4_HEIGHT - (margin * 2);
        
        const scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;

        // Calculate X and Y to perfectly center the image on the page
        const x = (A4_WIDTH - scaledWidth) / 2;
        const y = (A4_HEIGHT - scaledHeight) / 2;

        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Ensure the converter loader is visible for a minimum duration to feel substantial
      await new Promise(resolve => setTimeout(resolve, 1200));

      setPdfUrl(url);
    } catch (error) {
      console.error("Batch conversion failed:", error);
      alert("Something went wrong during conversion. Ensure files are valid JPG/PNGs.");
    } finally {
      setIsConverting(false);
    }
  };

  const resetTool = () => {
    files.forEach(f => {
      URL.revokeObjectURL(f.preview);
      allUrlsRef.current.delete(f.preview);
    });
    setFiles([]);
    setPdfUrl(null);
    setOutputName('Combined_Images');
  };

  const getDownloadName = () => {
    const trimmed = outputName.trim();
    if (!trimmed) return 'Combined_Images.pdf';
    return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
  };

  const seoSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Image to PDF Converter — ConvertAll",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Convert JPG, PNG, and WebP images to high-quality PDF files online. Free, safe browser-based local rendering.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <SEO 
        title="Convert Image to PDF Online - Free & Secure"
        description="Convert JPG, PNG, and WebP images to high-quality PDF files. Fast local browser-based conversion with no file uploads required."
        path="/image-to-pdf"
        schema={seoSchema}
      />
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FileImage className="text-blue-500" />
        Images to PDF
      </h2>

      {!pdfUrl ? (
        <>
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Loader2 className="animate-spin text-blue-500 w-12 h-12 mb-4" />
              <p className="text-gray-700 font-semibold text-lg animate-pulse">Processing Uploaded Images...</p>
              <p className="text-gray-400 text-sm mt-1">Preparing high-resolution previews</p>
            </div>
          ) : isConverting ? (
            <div className="flex flex-col items-center justify-center py-16 bg-blue-50/50 rounded-2xl border border-blue-100 animate-pulse">
              <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
              <p className="text-blue-800 font-semibold text-lg">Generating PDF...</p>
              <p className="text-blue-600 text-sm mt-1">Arranging images and rendering pages</p>
            </div>
          ) : (
            <>
              <FileUploader 
                onFilesSelected={handleFileSelect} 
                accept={{ 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'] }} 
              />
              
              {files.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-700">File Queue ({files.length})</h3>
                      <p className="text-xs text-gray-400">Drag items or use arrows to reorder pages</p>
                    </div>
                  </div>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="image-list">
                      {(provided) => (
                        <ul 
                          className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {files.map((fileObj, index) => (
                            <Draggable key={fileObj.id} draggableId={fileObj.id} index={index}>
                              {(provided, snapshot) => (
                                <li 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                                    snapshot.isDragging ? 'shadow-lg border-blue-400 bg-blue-50' : 'bg-gray-50 border-gray-200 hover:border-blue-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Drag Handle */}
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="text-gray-400 hover:text-blue-600 shrink-0 cursor-grab active:cursor-grabbing p-1"
                                    >
                                      <GripVertical className="w-5 h-5" />
                                    </div>

                                    {/* Image Thumbnail */}
                                    <div className="w-12 h-12 shrink-0 bg-white border border-gray-200 rounded-md overflow-hidden flex items-center justify-center">
                                      <img 
                                        src={fileObj.preview} 
                                        alt="preview" 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    
                                    {/* File Details */}
                                    <div className="flex flex-col truncate">
                                      <span className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                        {fileObj.rawFile.name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {(fileObj.rawFile.size / 1024 / 1024).toFixed(2)} MB • Page {index + 1}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Reorder Buttons */}
                                    <button 
                                      onClick={() => moveFile(index, -1)}
                                      disabled={index === 0}
                                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                      aria-label="Move page up"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => moveFile(index, 1)}
                                      disabled={index === files.length - 1}
                                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                      aria-label="Move page down"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {/* Divider */}
                                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                                    {/* Delete Button */}
                                    <button 
                                      onClick={() => removeFile(index)}
                                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all active:scale-95"
                                      aria-label="Remove file"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </li>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </ul>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {/* PDF Filename Settings */}
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <label htmlFor="output-filename" className="block text-sm font-semibold text-gray-700 mb-2">
                      PDF Filename
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <input
                        type="text"
                        id="output-filename"
                        value={outputName}
                        onChange={(e) => setOutputName(e.target.value)}
                        placeholder="Combined_Images"
                        className="w-full pl-3.5 pr-12 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm font-medium">.pdf</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={convertToPdf}
                    disabled={isConverting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Convert to Single PDF
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-xl sm:text-2xl font-bold text-green-700 mb-2">Batch Conversion Complete!</h3>
          <p className="text-green-600 mb-4">Successfully combined {files.length} images into one uniform A4 PDF.</p>
          
          {/* Filename Input on success screen */}
          <div className="max-w-xs mx-auto mb-6">
            <label htmlFor="output-filename-success" className="block text-xs font-semibold text-green-700 mb-1.5 text-left">
              Rename PDF File (Optional)
            </label>
            <div className="relative rounded-lg shadow-sm">
              <input
                type="text"
                id="output-filename-success"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="Combined_Images"
                className="w-full pl-3.5 pr-12 py-2 border border-green-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm font-medium">.pdf</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href={pdfUrl} 
              download={getDownloadName()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download PDF
            </a>
            <button 
              onClick={resetTool}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Convert More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}