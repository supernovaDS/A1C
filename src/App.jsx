import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import ImageToPdf from './components/tools/ImageToPdf';
import WordToPdf from './components/tools/WordToPdf';

function App() {
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-blue-200">
      <Navbar />
      
      <main className="pb-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/image-to-pdf" element={<ImageToPdf />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;