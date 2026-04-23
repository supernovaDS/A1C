import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Image as ImageIcon,
  FileImage,
} from "lucide-react";

const tools = [
  { title: "Image Converter", description: "Batch convert between JPG, PNG, and WEBP formats.", icon: <ImageIcon className="w-6 h-6 text-blue-600" />, path: "/image-converter" },
  { title: "Image to PDF", description: "Convert JPG or PNG images to a high-quality PDF.", icon: <FileImage className="w-6 h-6 text-blue-500" />, path: "/image-to-pdf" },
  { title: "PDF to Images", description: "Extract pages from PDFs into JPG/PNG images.", icon: <ImageIcon className="w-6 h-6 text-emerald-600" />, path: "/pdf-to-images" },
];

export default function ImageTools() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Image Tools
        </h1>
        <p className="text-base text-slate-500 max-w-xl">
          Convert and optimize images between popular formats — fast, local, and free.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
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
