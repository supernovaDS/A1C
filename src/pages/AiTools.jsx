import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
} from "lucide-react";

const tools = [
  {
    title: "Document Intelligence",
    description: "Use advanced AI to instantly extract text (OCR) from images or generate smart summaries of complex PDFs.",
    icon: <BrainCircuit className="w-7 h-7 text-indigo-500" />,
    path: "/document-ai",
  },
];

export default function AiTools() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          AI Tools
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Leverage the power of artificial intelligence for intelligent document analysis and text extraction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <Link
            key={index}
            to={tool.path}
            className="group block p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200 ease-in-out hover:-translate-y-1"
          >
            <div className="mb-4">
              <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors inline-block">
                {tool.icon}
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
            <p className="text-gray-600 text-sm mb-6 line-clamp-2">{tool.description}</p>
            <div className="flex items-center text-indigo-600 font-semibold text-sm">
              Try tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
