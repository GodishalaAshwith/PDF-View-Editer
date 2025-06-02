import React, { useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { usePDFContext } from "../context/PDFContext";
import { useNavigate } from "react-router-dom";

const EditorPage = () => {
  const {
    fileUrl,
    editMode,
    isLoading,
    setEditMode,
    blurText,
    eraseText,
    addText,
  } = usePDFContext();

  const [scale, setScale] = useState(1.0);
  const [newText, setNewText] = useState("");
  const navigate = useNavigate();

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar: (Toolbar) => (
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded ${
                editMode === "blur" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setEditMode("blur")}
            >
              Blur Text
            </button>
            <button
              className={`px-4 py-2 rounded ${
                editMode === "erase" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
              onClick={() => setEditMode("erase")}
            >
              Erase Text
            </button>
            <div className="flex items-center gap-2">
              <button
                className={`px-4 py-2 rounded ${
                  editMode === "text" ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
                onClick={() => setEditMode("text")}
              >
                Add Text
              </button>
              {editMode === "text" && (
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
          <Toolbar>{/* Default zoom controls will be rendered here */}</Toolbar>
        </div>
      </div>
    ),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Loading PDF...</p>
      </div>
    );
  }

  if (!fileUrl) {
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

  const handleClick = (e, viewer) => {
    if (editMode === "view") return;

    const viewport = viewer.getViewport();
    const pageRect = viewport.convertToPdfPoint(e.offsetX, e.offsetY);
    const x = pageRect[0];
    const y = pageRect[1];

    switch (editMode) {
      case "blur":
        blurText({ x, y, width: 100, height: 50 });
        break;
      case "erase":
        eraseText({ x, y, width: 100, height: 50 });
        break;
      case "text":
        if (newText) {
          addText(newText, { x, y });
          setNewText("");
        }
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ height: "100vh" }}>
      <Worker
        workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}
      >
        <div
          style={{ height: "100%" }}
          onClick={(e) => {
            const viewer = document.querySelector(".rpv-core__viewer");
            if (viewer) handleClick(e, viewer);
          }}
        >
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance]}
            defaultScale={SpecialZoomLevel.PageFit}
          />
        </div>
      </Worker>
    </div>
  );
};

export default EditorPage;
