import React from "react";
import { Link } from "react-router-dom";
import {
  FileImage,
  FileText,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  Minimize2,
  Scissors,
  RotateCw,
  Lock,
  Unlock,
  Stamp,
  Presentation,
  FileSpreadsheet,
  BrainCircuit,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

const categories = [
  {
    name: "PDF Tools",
    description: "Convert, merge, split, and secure PDF documents",
    path: "/pdf-tools",
    accent: "blue",
    tools: [
      { title: "Image to PDF", description: "Convert images to high-quality PDF documents.", icon: <FileImage className="w-6 h-6" />, path: "/image-to-pdf", iconColor: "text-blue-600" },
      { title: "Word to PDF", description: "Convert .docx files to exact PDF replicas.", icon: <FileText className="w-6 h-6" />, path: "/word-to-pdf", iconColor: "text-blue-500" },
      { title: "PDF to Images", description: "Extract pages as JPG or PNG images.", icon: <ImageIcon className="w-6 h-6" />, path: "/pdf-to-images", iconColor: "text-emerald-600" },
      { title: "Merge PDFs", description: "Combine multiple PDFs into one document.", icon: <Layers className="w-6 h-6" />, path: "/merge-pdf", iconColor: "text-indigo-500" },
      { title: "Compress PDF", description: "Reduce file size for email and uploads.", icon: <Minimize2 className="w-6 h-6" />, path: "/compress-pdf", iconColor: "text-orange-500" },
      { title: "Split PDF", description: "Extract specific pages from a document.", icon: <Scissors className="w-6 h-6 transform -scale-x-100" />, path: "/split-pdf", iconColor: "text-cyan-600" },
      { title: "Rotate PDF", description: "Fix page orientation instantly.", icon: <RotateCw className="w-6 h-6" />, path: "/rotate-pdf", iconColor: "text-teal-500" },
      { title: "Protect PDF", description: "Lock documents with a password.", icon: <Lock className="w-6 h-6" />, path: "/protect-pdf", iconColor: "text-red-500" },
      { title: "Unlock PDF", description: "Remove password restrictions.", icon: <Unlock className="w-6 h-6" />, path: "/unlock-pdf", iconColor: "text-green-600" },
      { title: "Watermark PDF", description: "Stamp text or images on pages.", icon: <Stamp className="w-6 h-6" />, path: "/watermark-pdf", iconColor: "text-slate-600" },
      { title: "PPT to PDF", description: "Convert presentations to PDF.", icon: <Presentation className="w-6 h-6" />, path: "/ppt-to-pdf", iconColor: "text-orange-600" },
      { title: "Excel to PDF", description: "Convert spreadsheets to PDF.", icon: <FileSpreadsheet className="w-6 h-6" />, path: "/excel-to-pdf", iconColor: "text-green-600" },
    ],
  },
  {
    name: "Image Tools",
    description: "Convert and optimize images between formats",
    path: "/image-tools",
    accent: "emerald",
    tools: [
      { title: "Image Converter", description: "Batch convert between JPG, PNG, and WEBP.", icon: <ImageIcon className="w-6 h-6" />, path: "/image-converter", iconColor: "text-blue-600" },
    ],
  },
  {
    name: "AI Tools",
    description: "Intelligent document analysis and extraction",
    path: "/ai-tools",
    accent: "blue",
    tools: [
      { title: "Document Intelligence", description: "AI-powered OCR and smart document summaries.", icon: <BrainCircuit className="w-6 h-6" />, path: "/document-ai", iconColor: "text-indigo-600" },
    ],
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="dot-grid-bg absolute inset-0 opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium">
              <Zap className="w-3.5 h-3.5" />
              Free & Open Source Document Toolkit
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
              Convert, process
              <br className="hidden sm:block" />
              & manage documents
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
              Professional-grade conversion for PDFs, images, and office files.
              Fast local processing with powerful API-backed conversions — all in your browser.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/pdf-tools"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
              >
                Explore PDF Tools
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/image-converter"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-sm transition-colors border border-slate-200 shadow-sm"
              >
                Try Image Converter
              </Link>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto mt-16">
            {[
              { icon: <Zap className="w-5 h-5 text-blue-600" />, title: "Browser-Based", desc: "Most tools run locally — your files never leave your device." },
              { icon: <Shield className="w-5 h-5 text-green-600" />, title: "Secure Processing", desc: "End-to-end encryption for API conversions. Zero data retention." },
              { icon: <Globe className="w-5 h-5 text-slate-600" />, title: "14+ Tools", desc: "PDF, DOCX, XLSX, PPTX, JPG, PNG, WEBP, and more." },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 animate-fade-in-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <div className="p-2 bg-slate-50 rounded-lg shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{f.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {categories.map((category) => (
          <div key={category.name} className="mb-14">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{category.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{category.description}</p>
              </div>
              <Link
                to={category.path}
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Tool Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
              {category.tools.map((tool, index) => (
                <Link
                  key={index}
                  to={tool.path}
                  className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ease-out"
                >
                  <div className={`p-2.5 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors shrink-0 ${tool.iconColor}`}>
                    {tool.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
