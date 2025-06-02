import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { SpecialZoomLevel } from "@react-pdf-viewer/core";
import { useNavigate } from "react-router-dom";
import { usePDFContext } from "../context/PDFContext";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const UploadPage = () => {
  const { loadPDF, fileUrl, isLoading, clearPDF } = usePDFContext();
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file?.type === "application/pdf") {
      // Clear any existing PDF
      clearPDF();

      // Load the new PDF
      const success = await loadPDF(file);
      if (!success) {
        alert("Error loading PDF. Please try again.");
      }
    } else {
      alert("Please upload a PDF file");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const handleProceed = () => {
    navigate("/editor");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-lg text-blue-500">Drop the PDF file here...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">
                Drag and drop a PDF file here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Only PDF files are accepted
              </p>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="mt-4 text-center">
            <p className="text-blue-600">Loading PDF...</p>
          </div>
        )}

        {fileUrl && !isLoading && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-green-600">File uploaded successfully!</p>
              <button
                onClick={handleProceed}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Proceed to Editor
              </button>
            </div>
            <div className="mt-4 border rounded-lg" style={{ height: "750px" }}>
              <Worker
                workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}
              >
                <Viewer
                  fileUrl={fileUrl}
                  plugins={[defaultLayoutPluginInstance]}
                  defaultScale={SpecialZoomLevel.PageFit}
                />
              </Worker>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
