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
} from "lucide-react";

const tools = [
  { title: "Image to PDF", description: "Convert JPG or PNG images to a single, high-quality PDF document.", icon: <FileImage className="w-6 h-6 text-blue-600" />, path: "/image-to-pdf" },
  { title: "Word to PDF", description: "Convert Microsoft Word documents (.docx) to exact PDF replicas.", icon: <FileText className="w-6 h-6 text-blue-500" />, path: "/word-to-pdf" },
  { title: "PDF to Images", description: "Extract pages from any PDF into high-quality JPG/PNG images.", icon: <ImageIcon className="w-6 h-6 text-emerald-600" />, path: "/pdf-to-images" },
  { title: "Merge PDFs", description: "Combine multiple PDF files into one. Drag to rearrange order.", icon: <Layers className="w-6 h-6 text-indigo-500" />, path: "/merge-pdf" },
  { title: "Compress PDF", description: "Reduce file size without losing quality. Perfect for email.", icon: <Minimize2 className="w-6 h-6 text-orange-500" />, path: "/compress-pdf" },
  { title: "Split PDF", description: "Extract specific pages or burst into single-page PDFs.", icon: <Scissors className="w-6 h-6 text-cyan-600 transform -scale-x-100" />, path: "/split-pdf" },
  { title: "Rotate PDF", description: "Fix upside-down or sideways pages instantly.", icon: <RotateCw className="w-6 h-6 text-teal-500" />, path: "/rotate-pdf" },
  { title: "Protect PDF", description: "Secure your document with a strong password.", icon: <Lock className="w-6 h-6 text-red-500" />, path: "/protect-pdf" },
  { title: "Unlock PDF", description: "Remove password security from your PDFs.", icon: <Unlock className="w-6 h-6 text-green-600" />, path: "/unlock-pdf" },
  { title: "Watermark PDF", description: "Stamp text or images across document pages.", icon: <Stamp className="w-6 h-6 text-slate-600" />, path: "/watermark-pdf" },
  { title: "PPT to PDF", description: "Convert PowerPoint presentations to PDF.", icon: <Presentation className="w-6 h-6 text-orange-600" />, path: "/ppt-to-pdf" },
  { title: "Excel to PDF", description: "Convert Excel spreadsheets to clean PDFs.", icon: <FileSpreadsheet className="w-6 h-6 text-green-600" />, path: "/excel-to-pdf" },
];

export default function PdfTools() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          PDF Tools
        </h1>
        <p className="text-base text-slate-500 max-w-xl">
          Everything you need to create, edit, convert, and secure PDF documents.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
        {tools.map((tool, index) => (
          <Link
            key={index}
            to={tool.path}
            className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ease-out"
          >
            <div className="p-2.5 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors shrink-0">
              {tool.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{tool.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{tool.description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Open tool <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
