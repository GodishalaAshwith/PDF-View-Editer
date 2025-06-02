import React, { useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { selectionModePlugin } from "@react-pdf-viewer/selection-mode";
import { usePDFContext } from "../context/PDFContext";
import { useNavigate } from "react-router-dom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/selection-mode/lib/styles/index.css";

const EditorPage = () => {
  const { 
    pdfFile, 
    fileUrl, 
    editMode, 
    isLoading,
    setEditMode, 
    blurText, 
    eraseText, 
    addText 
  } = usePDFContext();
  const [newText, setNewText] = useState("");
  const navigate = useNavigate();
  
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const selectionPluginInstance = selectionModePlugin();

  const handleToolSelect = (mode) => {
    setEditMode(mode);
  };

  const handleSelection = (e) => {
    if (!editMode || editMode === 'view') return;

    const coordinates = {
      x: e.startX,
      y: e.startY,
      width: e.endX - e.startX,
      height: e.endY - e.startY
    };

    switch (editMode) {
      case 'blur':
        blurText(coordinates);
        break;
      case 'erase':
        eraseText(coordinates);
        break;
      case 'text':
        if (newText) {
          addText(newText, coordinates);
          setNewText("");
        }
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Loading PDF...</p>
      </div>
    );
  }

  if (!pdfFile || !fileUrl) {
    return (
      <div className="flex flex-col justify-center items-center h-full gap-4">
        <p className="text-xl text-gray-600">No PDF file loaded</p>
        <button
          onClick={() => navigate("/upload")}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Upload a PDF
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex gap-4 items-center">
          <button
            className={`px-4 py-2 rounded ${
              editMode === 'blur' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => handleToolSelect('blur')}
          >
            Blur Text
          </button>
          <button
            className={`px-4 py-2 rounded ${
              editMode === 'erase' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => handleToolSelect('erase')}
          >
            Erase Text
          </button>
          <div className="flex items-center gap-2">
            <button
              className={`px-4 py-2 rounded ${
                editMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
              onClick={() => handleToolSelect('text')}
            >
              Add Text
            </button>
            {editMode === 'text' && (
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text to add..."
                className="border rounded px-2 py-1"
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance, selectionPluginInstance]}
            onTextSelection={handleSelection}
          />
        </Worker>
      </div>
    </div>
  );
};

export default EditorPage;