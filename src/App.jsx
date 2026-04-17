import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import ImageToPdf from './components/tools/ImageToPdf';
import WordToPdf from './components/tools/WordToPdf';
import PdfToImages from './components/tools/PdfToImages';
import MergePdf from './components/tools/MergePdf';
import CompressPdf from './components/tools/CompressPdf';
import SplitPdf from './components/tools/SplitPdf';
import RotatePdf from './components/tools/RotatePdf';

function App() {
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-blue-200">
      <Navbar />
      
      <main className="pb-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/image-to-pdf" element={<ImageToPdf />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route path="/pdf-to-images" element={<PdfToImages />} />
          <Route path="/merge-pdf" element={<MergePdf />} />
          <Route path="/compress-pdf" element={<CompressPdf />} />
          <Route path="/split-pdf" element={<SplitPdf />} />
          <Route path="/rotate-pdf" element={<RotatePdf />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;