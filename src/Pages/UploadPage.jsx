import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

const UploadPage = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileURL, setPdfFileURL] = useState(null);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file?.type === "application/pdf") {
      setPdfFile(file);
      setPdfFileURL(URL.createObjectURL(file)); // Create a URL for the PDF file
    } else {
      alert("Please upload a PDF file");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

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

        {pdfFile && (
          <div className="mt-4">
            <p className="text-green-600">File uploaded: {pdfFile.name}</p>
            <div className="mt-4 border rounded-lg">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer fileUrl={pdfFileURL} />
              </Worker>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
