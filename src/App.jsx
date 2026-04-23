import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import PdfTools from './pages/PdfTools';
import ImageTools from './pages/ImageTools';
import AiTools from './pages/AiTools';
import ImageToPdf from './components/tools/ImageToPdf';
import WordToPdf from './components/tools/WordToPdf';
import PdfToImages from './components/tools/PdfToImages';
import MergePdf from './components/tools/MergePdf';
import CompressPdf from './components/tools/CompressPdf';
import SplitPdf from './components/tools/SplitPdf';
import RotatePdf from './components/tools/RotatePdf';
import ProtectPdf from './components/tools/ProtectPdf';
import UnlockPdf from './components/tools/UnlockPdf';
import WatermarkPdf from './components/tools/WatermarkPdf';
import PptToPdf from './components/tools/PptToPdf';
import ExcelToPdf from './components/tools/XlsToPdf';
import ImageConverter from './components/tools/ImageConverter';
import DocumentAi from './components/tools/DocumentAi';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />
      
      <main className="flex-1 pb-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pdf-tools" element={<PdfTools />} />
          <Route path="/image-tools" element={<ImageTools />} />
          <Route path="/ai-tools" element={<AiTools />} />
          <Route path="/image-to-pdf" element={<ImageToPdf />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route path="/pdf-to-images" element={<PdfToImages />} />
          <Route path="/merge-pdf" element={<MergePdf />} />
          <Route path="/compress-pdf" element={<CompressPdf />} />
          <Route path="/split-pdf" element={<SplitPdf />} />
          <Route path="/rotate-pdf" element={<RotatePdf />} />
          <Route path="/protect-pdf" element={<ProtectPdf />} />
          <Route path="/unlock-pdf" element={<UnlockPdf />} />
          <Route path="/watermark-pdf" element={<WatermarkPdf />} />
          <Route path="/ppt-to-pdf" element={<PptToPdf />} />
          <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
          <Route path="/image-converter" element={<ImageConverter />} />
          <Route path="/document-ai" element={<DocumentAi />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;