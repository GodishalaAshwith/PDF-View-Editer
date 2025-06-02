import React from "react";
import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const EditorPage = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="h-screen">
      <div className="h-full">
        
      </div>
    </div>
  );
};

export default EditorPage;