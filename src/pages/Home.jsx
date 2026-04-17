import React from 'react';
import { Link } from 'react-router-dom';
import { FileImage, FileText, ArrowRight } from 'lucide-react';

export default function Home() {
  const tools = [
    {
      title: 'Image to PDF',
      description: 'Convert JPG or PNG images to a single, high-quality PDF document instantly in your browser.',
      icon: <FileImage className="w-8 h-8 text-blue-500" />,
      path: '/image-to-pdf',
      badge: 'Local Fast',
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      title: 'Word to PDF',
      description: 'Convert Microsoft Word documents (.docx) to exact PDF replicas using our secure API.',
      icon: <FileText className="w-8 h-8 text-purple-500" />,
      path: '/word-to-pdf',
      badge: 'API Powered',
      badgeColor: 'bg-purple-100 text-purple-700'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          The Ultimate Document Toolkit
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Convert, merge, and edit your files securely. Fast local processing mixed with powerful API conversions.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <Link 
            key={index} 
            to={tool.path}
            className="group block p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 ease-in-out hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                {tool.icon}
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${tool.badgeColor}`}>
                {tool.badge}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
            <p className="text-gray-600 text-sm mb-6 line-clamp-2">
              {tool.description}
            </p>
            <div className="flex items-center text-blue-600 font-semibold text-sm">
              Try tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}