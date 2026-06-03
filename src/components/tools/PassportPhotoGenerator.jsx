import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FileUploader from '../shared/FileUploader';
import { Camera, Download, Loader2, AlertTriangle, ArrowRight, X, FileArchive, Info, Settings, Move, RotateCw, ZoomIn, Sliders } from 'lucide-react';
import SEO from '../SEO';

const SIZES = {
  us: { name: 'United States (2" x 2")', widthMm: 50.8, heightMm: 50.8, ratio: 1 },
  eu: { name: 'EU / UK / Schengen (35 x 45 mm)', widthMm: 35, heightMm: 45, ratio: 35/45 },
  ca: { name: 'Canada (50 x 70 mm)', widthMm: 50, heightMm: 70, ratio: 50/70 },
  in: { name: 'India (35 x 45 mm)', widthMm: 35, heightMm: 45, ratio: 35/45 },
  custom: { name: 'Custom Dimensions', widthMm: 35, heightMm: 45, ratio: 35/45 }
};

const SHEETS = {
  single: { name: 'Single Photo only', widthIn: 0, heightIn: 0 },
  '4x6': { name: '4" x 6" Photo Paper (Grid)', widthIn: 4, heightIn: 6 },
  '5x7': { name: '5" x 7" Photo Paper (Grid)', widthIn: 5, heightIn: 7 },
  a4: { name: 'A4 Paper (Grid)', widthIn: 8.27, heightIn: 11.69 }
};

export default function PassportPhotoGenerator() {
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  
  // Size & Layout Settings
  const [selectedSize, setSelectedSize] = useState('us');
  const [customWidth, setCustomWidth] = useState(35);
  const [customHeight, setCustomHeight] = useState(45);
  const [selectedSheet, setSelectedSheet] = useState('4x6');
  
  // Transform Settings
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // Color Settings
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Editor Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Generating State
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);

  // Load Image Element
  useEffect(() => {
    if (!imageSrc) {
      setImageElement(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      // Reset transforms
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => {
      setError("Failed to load selected image.");
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw Interactive Canvas Preview
  useEffect(() => {
    if (!canvasRef.current || !imageElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply adjustments
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    ctx.save();
    
    // Move coordinate origin to center of canvas
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    // Scale / Zoom
    // Find base scale to cover the canvas
    const wScale = canvas.width / imageElement.width;
    const hScale = canvas.height / imageElement.height;
    const baseScale = Math.max(wScale, hScale);
    ctx.scale(baseScale * zoom, baseScale * zoom);

    // Draw image centered at the origin
    ctx.drawImage(imageElement, -imageElement.width / 2, -imageElement.height / 2);
    
    ctx.restore();
    // Reset filters
    ctx.filter = 'none';
  }, [imageElement, zoom, rotation, offset, brightness, contrast, saturation, selectedSize, customWidth, customHeight]);

  const handleFileSelect = (newFiles) => {
    if (newFiles.length === 0) return;
    const file = newFiles[0];
    setFile(file);
    setError(null);
    setResultUrl(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Dragging to pan
  const handleMouseDown = (e) => {
    if (!imageElement) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support
  const handleTouchStart = (e) => {
    if (!imageElement || e.touches.length === 0) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const currentSizeConfig = SIZES[selectedSize];
  const sizeWidthMm = selectedSize === 'custom' ? customWidth : currentSizeConfig.widthMm;
  const sizeHeightMm = selectedSize === 'custom' ? customHeight : currentSizeConfig.heightMm;
  const sizeRatio = selectedSize === 'custom' ? (customWidth / customHeight) : currentSizeConfig.ratio;

  // Render high quality passport
  const renderSingleCroppedBlob = () => {
    return new Promise((resolve) => {
      const scaleDpi = 300;
      const mmToInch = 25.4;
      const widthPx = Math.round((sizeWidthMm / mmToInch) * scaleDpi);
      const heightPx = Math.round((sizeHeightMm / mmToInch) * scaleDpi);

      const highResCanvas = document.createElement('canvas');
      highResCanvas.width = widthPx;
      highResCanvas.height = heightPx;
      const ctx = highResCanvas.getContext('2d');

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.save();
      
      // We scale the offset relative to preview canvas size
      const previewCanvas = canvasRef.current;
      const scaleX = widthPx / previewCanvas.width;
      const scaleY = heightPx / previewCanvas.height;

      ctx.translate(widthPx / 2 + offset.x * scaleX, heightPx / 2 + offset.y * scaleY);
      ctx.rotate((rotation * Math.PI) / 180);
      
      const wScale = widthPx / imageElement.width;
      const hScale = heightPx / imageElement.height;
      const baseScale = Math.max(wScale, hScale);
      
      ctx.scale(baseScale * zoom, baseScale * zoom);
      ctx.drawImage(imageElement, -imageElement.width / 2, -imageElement.height / 2);
      
      ctx.restore();
      highResCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  };

  // Arrange on Grid Sheet
  const generateGridSheet = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const croppedBlob = await renderSingleCroppedBlob();
      const croppedUrl = URL.createObjectURL(croppedBlob);

      if (selectedSheet === 'single') {
        setResultUrl(croppedUrl);
        setIsGenerating(false);
        return;
      }

      // Arrange in grid on sheet canvas
      const dpi = 300;
      const mmToInch = 25.4;
      const sheetConfig = SHEETS[selectedSheet];
      let sheetWidthPx, sheetHeightPx;

      if (selectedSheet === 'a4') {
        sheetWidthPx = Math.round(8.27 * dpi);
        sheetHeightPx = Math.round(11.69 * dpi);
      } else {
        sheetWidthPx = sheetConfig.widthIn * dpi;
        sheetHeightPx = sheetConfig.heightIn * dpi;
      }

      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = sheetWidthPx;
      sheetCanvas.height = sheetHeightPx;
      const ctx = sheetCanvas.getContext('2d');

      // Fill background white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

      // Load cropped image back as image source
      const cropImg = new Image();
      await new Promise((resolve, reject) => {
        cropImg.onload = resolve;
        cropImg.onerror = reject;
        cropImg.src = croppedUrl;
      });

      const photoWidthPx = Math.round((sizeWidthMm / mmToInch) * dpi);
      const photoHeightPx = Math.round((sizeHeightMm / mmToInch) * dpi);
      
      // Calculate margins and spacing
      const paddingPx = Math.round(5 * (dpi / mmToInch)); // 5mm spacing
      const marginPx = Math.round(10 * (dpi / mmToInch)); // 10mm outer margin
      
      const cols = Math.floor((sheetWidthPx - marginPx * 2 + paddingPx) / (photoWidthPx + paddingPx));
      const rows = Math.floor((sheetHeightPx - marginPx * 2 + paddingPx) / (photoHeightPx + paddingPx));

      if (cols === 0 || rows === 0) {
        throw new Error("Passport photo size is too large for the selected sheet layout.");
      }

      // Center the grid on the sheet
      const gridWidth = cols * photoWidthPx + (cols - 1) * paddingPx;
      const gridHeight = rows * photoHeightPx + (rows - 1) * paddingPx;
      const startX = (sheetWidthPx - gridWidth) / 2;
      const startY = (sheetHeightPx - gridHeight) / 2;

      // Draw Grid with crop marks
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * (photoWidthPx + paddingPx);
          const y = startY + r * (photoHeightPx + paddingPx);

          // Draw Photo
          ctx.drawImage(cropImg, x, y, photoWidthPx, photoHeightPx);

          // Draw crop marks (thin border)
          ctx.strokeStyle = '#D1D5DB';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, photoWidthPx, photoHeightPx);
        }
      }

      sheetCanvas.toBlob((blob) => {
        const finalUrl = URL.createObjectURL(blob);
        setResultUrl(finalUrl);
        setIsGenerating(false);
      }, 'image/jpeg', 0.95);

    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
      setIsGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = selectedSheet === 'single' ? 'passport_photo.jpg' : `passport_photos_${selectedSheet}_sheet.jpg`;
    a.click();
  };

  const resetTool = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    setFile(null);
    setImageSrc(null);
    setImageElement(null);
    setResultUrl(null);
    setError(null);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  // Preview sizing styles
  const previewWidth = 320;
  const previewHeight = Math.round(previewWidth / sizeRatio);

  const seoSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Passport Photo Generator Online — ConvertAll",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Create official digital passport photos and printable grids online. Crop and adjust image alignment for US, EU, UK, CA, and IN sizes.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
      <SEO 
        title="Passport Photo Generator - Create Print Sheets"
        description="Generate compliant digital passport photos and print sheets online. Resize and crop to official specifications."
        path="/passport-photo"
        schema={seoSchema}
      />
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-sm">
            <Camera className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Passport Photo Generator</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Create compliant digital passport photos and print-ready sheets locally in seconds.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!imageSrc ? (
        <FileUploader 
          onFilesSelected={handleFileSelect} 
          accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }} 
          maxFiles={1}
        />
      ) : !resultUrl ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
          
          {/* Interactive Viewport (Cropper) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="mb-3 flex items-center justify-between w-full">
              <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                <Move className="w-4 h-4" /> Drag to Position
              </span>
              <span className="text-xs text-slate-400">
                Align head/chin to overlay guides
              </span>
            </div>

            <div 
              className="relative border border-slate-300 rounded-2xl shadow-inner bg-slate-900 overflow-hidden cursor-move touch-none select-none"
              style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              {/* Canvas Preview */}
              <canvas 
                ref={canvasRef} 
                width={previewWidth} 
                height={previewHeight}
                className="w-full h-full"
              />

              {/* Passport Guidelines Overlay */}
              <div className="absolute inset-0 pointer-events-none w-full h-full flex flex-col items-center justify-center">
                {/* Visual Head Oval Guide */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Outer shade */}
                  <path 
                    d={`M0,0 H${previewWidth} V${previewHeight} H0 Z M${previewWidth/2},${previewHeight * 0.15} C${previewWidth/2 + previewWidth*0.25},${previewHeight * 0.15} ${previewWidth/2 + previewWidth*0.25},${previewHeight * 0.70} ${previewWidth/2},${previewHeight * 0.70} C${previewWidth/2 - previewWidth*0.25},${previewHeight * 0.70} ${previewWidth/2 - previewWidth*0.25},${previewHeight * 0.15} ${previewWidth/2},${previewHeight * 0.15} Z`} 
                    fill="rgba(15, 23, 42, 0.45)" 
                    fillRule="evenodd"
                  />
                  {/* Head Oval */}
                  <ellipse 
                    cx="50%" 
                    cy="42%" 
                    rx="23%" 
                    ry="28%" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="2.5" 
                    strokeDasharray="4,4" 
                  />
                  {/* Eyes Line */}
                  <line 
                    x1="15%" 
                    y1="40%" 
                    x2="85%" 
                    y2="40%" 
                    stroke="#3B82F6" 
                    strokeWidth="1.5" 
                    strokeDasharray="2,2" 
                  />
                  {/* Chin Limit Guide */}
                  <line 
                    x1="20%" 
                    y1="70%" 
                    x2="80%" 
                    y2="70%" 
                    stroke="#EF4444" 
                    strokeWidth="2" 
                    strokeDasharray="3,3" 
                  />
                  
                  {/* Guide text indicators */}
                  <text x="50%" y="8%" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">PASSPORT GUIDE</text>
                  <text x="8%" y="41%" fill="#3B82F6" fontSize="8" fontWeight="bold">EYES</text>
                  <text x="8%" y="71%" fill="#EF4444" fontSize="8" fontWeight="bold">CHIN</text>
                </svg>
              </div>
            </div>

            {/* Quick helper controls */}
            <div className="mt-4 flex gap-2 w-full max-w-xs">
              <button 
                onClick={() => setRotation(prev => (prev - 90) % 360)}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
              >
                <RotateCw className="w-3.5 h-3.5 rotate-180" /> Rotate L
              </button>
              <button 
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate R
              </button>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Format Settings */}
            <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <Settings className="w-4 h-4 text-blue-500" /> Passport Size Settings
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Select Country/Size Standard</label>
                <select 
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-700"
                >
                  {Object.entries(SIZES).map(([key, item]) => (
                    <option key={key} value={key}>{item.name}</option>
                  ))}
                </select>
              </div>

              {selectedSize === 'custom' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Width (mm)</label>
                    <input 
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Math.max(10, parseInt(e.target.value) || 35))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Height (mm)</label>
                    <input 
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Math.max(10, parseInt(e.target.value) || 45))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Print Layout</label>
                <select 
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-700"
                >
                  {Object.entries(SHEETS).map(([key, item]) => (
                    <option key={key} value={key}>{item.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Adjustments Panel */}
            <div className="p-5 border border-slate-200 bg-white rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <Sliders className="w-4 h-4 text-emerald-500" /> Photo Adjustments
              </h3>

              {/* Zoom Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500">Zoom</span>
                  <span className="text-xs text-blue-600 font-bold">{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.5" max="3" step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Rotation Precision Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500">Align Tilt (Rotate)</span>
                  <span className="text-xs text-blue-600 font-bold">{rotation}°</span>
                </div>
                <input 
                  type="range"
                  min="-45" max="45" step="0.5"
                  value={rotation}
                  onChange={(e) => setRotation(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500">Brightness</span>
                  <span className="text-xs text-blue-600 font-bold">{brightness}%</span>
                </div>
                <input 
                  type="range"
                  min="50" max="150" step="1"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-500">Contrast</span>
                  <span className="text-xs text-blue-600 font-bold">{contrast}%</span>
                </div>
                <input 
                  type="range"
                  min="50" max="150" step="1"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={resetTool}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-2xl font-bold text-sm transition-all"
              >
                Reset Image
              </button>
              <button 
                onClick={generateGridSheet}
                disabled={isGenerating}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" /> Generating...
                  </>
                ) : (
                  <>Create Passport Photo</>
                )}
              </button>
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-normal">
                Align the chin, head oval, and eye guides precisely. When generated as a grid layout, gray thin crop guides will be added for clean cutting.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up text-center">
          <div className="py-8 px-6 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm">
            <h3 className="text-3xl font-extrabold text-blue-800 mb-2">Passport Sheet Ready!</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Your compliant passport print layout has been rendered local-first in high quality (300 DPI).
            </p>
          </div>

          {/* Generated Result Preview */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-6 flex justify-center shadow-inner relative group">
            <div className="max-w-md max-h-96 overflow-auto border border-slate-300 rounded-xl shadow bg-white">
              <img 
                src={resultUrl} 
                alt="Passport Photos Print Sheet Preview" 
                className="max-h-full object-contain mx-auto"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={downloadResult}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-5 h-5" /> Download High-Res File
            </button>
            <button 
              onClick={() => setResultUrl(null)}
              className="bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-2xl font-bold transition-all"
            >
              Adjust Alignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
