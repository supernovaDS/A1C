import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

export default function FileUploader({ onFilesSelected, accept, maxFiles = 50 }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 ease-in-out
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
      
      {isDragActive ? (
        <p className="text-lg font-semibold text-blue-600">Drop the files here ...</p>
      ) : (
        <div>
          <p className="text-lg font-medium text-gray-700">Drag & drop files here, or click to select</p>
          <p className="text-sm text-gray-500 mt-2">Supports {maxFiles > 1 ? 'multiple files' : 'a single file'}</p>
        </div>
      )}
    </div>
  );
}