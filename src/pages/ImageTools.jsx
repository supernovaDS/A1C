import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Image as ImageIcon,
  FileImage,
} from "lucide-react";

const tools = [
  {
    title: "Image Converter",
    description: "Quickly convert between JPG, PNG, and WEBP formats natively in your browser. Supports batch conversion.",
    icon: <ImageIcon className="w-7 h-7 text-pink-500" />,
    path: "/image-converter",
  },
  {
    title: "Image to PDF",
    description: "Convert JPG or PNG images to a single, high-quality PDF document instantly in your browser.",
    icon: <FileImage className="w-7 h-7 text-blue-500" />,
    path: "/image-to-pdf",
  },
  {
    title: "PDF to Images",
    description: "Extract specific pages from any PDF into high-quality JPG/PNG images and download as a ZIP.",
    icon: <ImageIcon className="w-7 h-7 text-emerald-500" />,
    path: "/pdf-to-images",
  },
];

export default function ImageTools() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          Image Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Convert and optimize images between popular formats — fast, local, and free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <Link
            key={index}
            to={tool.path}
            className="group block p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-200 transition-all duration-200 ease-in-out hover:-translate-y-1"
          >
            <div className="mb-4">
              <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-pink-50 transition-colors inline-block">
                {tool.icon}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
            <p className="text-gray-600 text-sm mb-6 line-clamp-2">{tool.description}</p>
            <div className="flex items-center text-pink-600 font-semibold text-sm">
              Try tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
