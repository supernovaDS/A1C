import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Layers } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Helper to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">ConvertAll</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`${isActive('/') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'} transition-colors`}>
              Home
            </Link>
            <Link to="/image-to-pdf" className={`${isActive('/image-to-pdf') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'} transition-colors`}>
              Image to PDF
            </Link>
            <Link to="/word-to-pdf" className={`${isActive('/word-to-pdf') ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600'} transition-colors`}>
              Word to PDF
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-50 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link 
              to="/" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Home
            </Link>
            <Link 
              to="/image-to-pdf" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Image to PDF
            </Link>
            <Link 
              to="/word-to-pdf" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              Word to PDF
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}