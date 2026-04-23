import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Layers, ChevronDown } from "lucide-react";

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

  // Close mobile menu on route change
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
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">
                ConvertAll
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) =>
              item.type === "link" ? (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
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
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path) || openDropdown === item.label
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        openDropdown === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </Link>

                  {/* Dropdown */}
                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      {/* View All link */}
                      <Link
                        to={item.path}
                        className="block px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 border-b border-gray-100 mb-1"
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
                              : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
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
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
            >
              {isMobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-50 absolute w-full shadow-lg z-50">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) =>
              item.type === "link" ? (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
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
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {item.label}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        mobileAccordion === item.label ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {mobileAccordion === item.label && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-blue-100 pl-3">
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
                              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
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
