import React, { useState } from "react";
import FileUploader from "../shared/FileUploader";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";

export default function WordToPdf() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (files) => {
    setFile(files[0]); // Only handle one Word doc at a time for the API
    setPdfUrl(null);
    setError(null);
  };

  const convertWithApi = async () => {
    if (!file) return;
    setIsConverting(true);
    setError(null);

    try {
      // Use the new Token variable
      const token = import.meta.env.VITE_CONVERTAPI_TOKEN;
      if (!token)
        throw new Error("API Token is missing. Check your .env file.");

      const formData = new FormData();
      formData.append("File", file);

      // Remove the ?Secret= from the URL and add the Authorization header
      const response = await fetch(
        `https://v2.convertapi.com/convert/docx/to/pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.Message || "Failed to convert document.");
      }

      // ConvertAPI returns the file as a base64 string in the response
      const fileData = data.Files[0].FileData;

      // Convert base64 back to a downloadable Blob
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error("API Conversion Error:", err);
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FileText className="text-blue-600" />
        Word to PDF
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {!pdfUrl ? (
        <>
          <FileUploader
            onFilesSelected={handleFileSelect}
            accept={{
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
              "application/msword": [".doc"],
            }}
            maxFiles={1}
          />

          {file && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
              <span className="font-medium text-gray-700 truncate w-full sm:w-auto">
                {file.name}
              </span>
              <button
                onClick={convertWithApi}
                disabled={isConverting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isConverting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  "Convert Document"
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="text-xl font-bold text-green-700 mb-4">
            Document Converted!
          </h3>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={pdfUrl}
              download={`${file.name.split(".")[0]}.pdf`}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Download PDF
            </a>
            <button
              onClick={() => {
                setFile(null);
                setPdfUrl(null);
              }}
              className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Convert Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
