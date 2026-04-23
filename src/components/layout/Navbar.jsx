import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

const navItems = [
  { label: "Home", path: "/", type: "link" },
  {
    label: "PDF Tools",
    path: "/pdf-tools",
    type: "dropdown",
    children: [
      { label: "Image to PDF", path: "/image-to-pdf" },
      { label: "Word to PDF", path: "/word-to-pdf" },
      { label: "PPT to PDF", path: "/ppt-to-pdf" },
      { label: "Excel to PDF", path: "/excel-to-pdf" },
      { label: "PDF to Images", path: "/pdf-to-images" },
      { label: "Merge PDFs", path: "/merge-pdf" },
      { label: "Compress PDF", path: "/compress-pdf" },
      { label: "Split PDF", path: "/split-pdf" },
      { label: "Rotate PDF", path: "/rotate-pdf" },
      { label: "Protect PDF", path: "/protect-pdf" },
      { label: "Unlock PDF", path: "/unlock-pdf" },
      { label: "Watermark PDF", path: "/watermark-pdf" },
    ],
  },
  {
    label: "Image Tools",
    path: "/image-tools",
    type: "dropdown",
    children: [
      { label: "Image Converter", path: "/image-converter" },
      { label: "Image to PDF", path: "/image-to-pdf" },
      { label: "PDF to Images", path: "/pdf-to-images" },
    ],
  },
  { label: "AI Tools", path: "/ai-tools", type: "link" },
];

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileAccordion, setMobileAccordion] = useState(null);
  const location = useLocation();
  const dropdownTimerRef = useRef(null);

  useEffect(() => {
    setIsMobileOpen(false);
    setMobileAccordion(null);
    setOpenDropdown(null);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleDropdownEnter = (label) => {
    clearTimeout(dropdownTimerRef.current);
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center py-2">
              <span className="font-extrabold text-2xl tracking-tight">
                <span className="text-slate-800">convert</span>
                <span className="text-blue-600">A</span>
                <span className="text-green-600">ll</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) =>
              item.type === "link" ? (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(item.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path) || openDropdown === item.label
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </Link>

                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-fade-in-up" style={{animationDuration: '0.15s'}}>
                      <Link
                        to={item.path}
                        className="block px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 border-b border-gray-100 mb-1"
                      >
                        View all {item.label}
                      </Link>
                      {item.children.map((child) => (
                        <Link
                          key={child.path + child.label}
                          to={child.path}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isActive(child.path)
                              ? "text-blue-600 bg-blue-50 font-medium"
                              : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none p-2 rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg z-50 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
          <div className="px-4 pt-2 pb-4 space-y-0.5">
            {navItems.map((item) =>
              item.type === "link" ? (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-blue-600 bg-blue-50"
                      : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setMobileAccordion(
                        mobileAccordion === item.label ? null : item.label
                      )
                    }
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        mobileAccordion === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileAccordion === item.label && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-blue-100 pl-3">
                      <Link
                        to={item.path}
                        className="block px-3 py-2 rounded-md text-sm font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        View All
                      </Link>
                      {item.children.map((child) => (
                        <Link
                          key={child.path + child.label}
                          to={child.path}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive(child.path)
                              ? "text-blue-600 bg-blue-50 font-medium"
                              : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
