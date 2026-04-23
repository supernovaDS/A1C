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
} from "lucide-react";

const categories = [
  {
    name: "PDF Tools",
    description: "Convert, merge, split, and manage your PDF documents",
    path: "/pdf-tools",
    tools: [
      {
        title: "Image to PDF",
        description:
          "Convert JPG or PNG images to a single, high-quality PDF document instantly in your browser.",
        icon: <FileImage className="w-7 h-7 text-blue-500" />,
        path: "/image-to-pdf",
        color: "blue",
      },
      {
        title: "Word to PDF",
        description:
          "Convert Microsoft Word documents (.docx) to exact PDF replicas using our secure API.",
        icon: <FileText className="w-7 h-7 text-purple-500" />,
        path: "/word-to-pdf",
        color: "purple",
      },
      {
        title: "PDF to Images",
        description:
          "Extract specific pages from any PDF into high-quality JPG/PNG images and download as a ZIP.",
        icon: <ImageIcon className="w-7 h-7 text-emerald-500" />,
        path: "/pdf-to-images",
        color: "emerald",
      },
      {
        title: "Merge PDFs",
        description:
          "Combine multiple PDF files into one. Drag and drop to rearrange order securely in your browser.",
        icon: <Layers className="w-7 h-7 text-indigo-500" />,
        path: "/merge-pdf",
        color: "indigo",
      },
      {
        title: "Compress PDF",
        description:
          "Reduce file size heavily without losing quality. Perfect for email attachments and web uploads.",
        icon: <Minimize2 className="w-7 h-7 text-orange-500" />,
        path: "/compress-pdf",
        color: "orange",
      },
      {
        title: "Split PDF",
        description:
          "Extract specific pages or burst a large document into single-page PDFs instantly in your browser.",
        icon: (
          <Scissors className="w-7 h-7 text-cyan-500 transform -scale-x-100" />
        ),
        path: "/split-pdf",
        color: "cyan",
      },
      {
        title: "Rotate PDF",
        description:
          "Fix upside-down or sideways pages. Rotate individual pages or the entire document instantly.",
        icon: <RotateCw className="w-7 h-7 text-teal-500" />,
        path: "/rotate-pdf",
        color: "teal",
      },
      {
        title: "Protect PDF",
        description:
          "Secure your document with a strong password. All encryption happens locally in your browser.",
        icon: <Lock className="w-7 h-7 text-red-500" />,
        path: "/protect-pdf",
        color: "red",
      },
      {
        title: "Unlock PDF",
        description:
          "Permanently remove password security and restrictions from your PDFs securely in your browser.",
        icon: <Unlock className="w-7 h-7 text-green-500" />,
        path: "/unlock-pdf",
        color: "green",
      },
      {
        title: "Watermark PDF",
        description:
          "Stamp text or images across your document pages to mark them as confidential, draft, or approved.",
        icon: <Stamp className="w-7 h-7 text-purple-500" />,
        path: "/watermark-pdf",
        color: "purple",
      },
      {
        title: "PPT to PDF",
        description:
          "Convert PowerPoint presentations (.ppt, .pptx) into universally readable PDF slides instantly.",
        icon: <Presentation className="w-7 h-7 text-orange-600" />,
        path: "/ppt-to-pdf",
        color: "orange",
      },
      {
        title: "Excel to PDF",
        description:
          "Convert Excel spreadsheets (.xls, .xlsx) into clean, easy-to-read PDF documents.",
        icon: <FileSpreadsheet className="w-7 h-7 text-green-600" />,
        path: "/excel-to-pdf",
        color: "green",
      },
    ],
  },
  {
    name: "Image Tools",
    description: "Convert and optimize images between formats",
    path: "/image-tools",
    tools: [
      {
        title: "Image Converter",
        description:
          "Quickly convert between JPG, PNG, and WEBP formats natively in your browser. Supports batch conversion.",
        icon: <ImageIcon className="w-7 h-7 text-pink-500" />,
        path: "/image-converter",
        color: "pink",
      },
    ],
  },
  {
    name: "AI Tools",
    description: "Intelligent document analysis powered by AI",
    path: "/ai-tools",
    tools: [
      {
        title: "Document Intelligence",
        description:
          "Use advanced AI to instantly extract text (OCR) from images or generate smart summaries of complex PDFs.",
        icon: <BrainCircuit className="w-7 h-7 text-indigo-500" />,
        path: "/document-ai",
        color: "indigo",
      },
    ],
  },
];

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          The Ultimate Document Toolkit
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Convert, merge, and edit your files securely. Fast local processing
          mixed with powerful API conversions.
        </p>
      </div>

      {/* Category Sections */}
      {categories.map((category) => (
        <section key={category.name} className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {category.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {category.description}
              </p>
            </div>
            <Link
              to={category.path}
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.tools.map((tool, index) => (
              <Link
                key={index}
                to={tool.path}
                className="group block p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 ease-in-out hover:-translate-y-1"
              >
                <div className="mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors inline-block">
                    {tool.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                  {tool.description}
                </p>
                <div className="flex items-center text-blue-600 font-semibold text-sm">
                  Try tool{" "}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
