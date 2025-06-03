
import React from 'react';
import { EditTool } from '../types';

interface ToolbarProps {
  selectedTool: EditTool;
  onSelectTool: (tool: EditTool) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSavePdf: () => void;
  isPdfLoaded: boolean;
  isProcessing: boolean;
  currentZoom: number;
  onZoomChange: (zoom: number) => void;
}

const ToolButton: React.FC<{
  label: string;
  icon?: React.ReactNode;
  tool: EditTool;
  currentTool: EditTool;
  onClick: (tool: EditTool) => void;
  disabled?: boolean;
}> = ({ label, icon, tool, currentTool, onClick, disabled }) => (
  <button
    title={label}
    disabled={disabled}
    onClick={() => onClick(tool)}
    className={`tool-button p-2 rounded-md flex items-center justify-center transition-colors duration-150 ease-in-out
                ${currentTool === tool ? 'bg-primary-600 text-white' : 'bg-secondary-200 hover:bg-secondary-300 text-secondary-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {icon || label}
  </button>
);


const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onSelectTool,
  onFileUpload,
  onSavePdf,
  isPdfLoaded,
  isProcessing,
  currentZoom,
  onZoomChange
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

  return (
    <div className="bg-secondary-50 p-3 shadow-sm flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".pdf"
          onChange={onFileUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={handleUploadClick}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-150 ease-in-out flex items-center"
          disabled={isProcessing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Upload PDF
        </button>
      </div>

      {isPdfLoaded && (
        <>
          <div className="flex items-center gap-2 border-l border-r border-secondary-300 px-3 mx-2">
            <ToolButton label="Cursor" tool={EditTool.CURSOR} currentTool={selectedTool} onClick={onSelectTool} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>} 
            />
            <ToolButton label="Blur" tool={EditTool.BLUR} currentTool={selectedTool} onClick={onSelectTool} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655 11.745 12m5.256-2.344-.333 3.488M12.752 21.064C6.389 20.362 2.25 15.363 2.25 9.375c0-1.388.28-2.705.784-3.922A.75.75 0 0 1 3.68 5.03l14.293 7.67a.75.75 0 0 1-.152 1.32L18 14.252l-2.071 5.422a.75.75 0 0 1-1.32.152Z" /></svg>}
            />
            <ToolButton label="Erase" tool={EditTool.ERASE} currentTool={selectedTool} onClick={onSelectTool} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.243.096 3.261.263m-.001-.264c.112-.042.227-.082.344-.121a48.106 48.106 0 0 1 7.896 0c.117.039.232.079.344.121m-4.312 5.715L11.995 10.568l-1.57 1.571m1.571-1.571 1.57 1.57M3 8.25V19.5a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 19.5V8.25" /></svg>}
            />
            <ToolButton label="Add Text" tool={EditTool.TEXT} currentTool={selectedTool} onClick={onSelectTool} 
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-6.75 3h9m-9 3h9M3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v17.25c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 22.125V4.875C1.5 3.84 2.34 3 3.375 3Z" /></svg>}
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="zoom-select" className="text-sm font-medium text-secondary-700">Zoom:</label>
            <select
              id="zoom-select"
              value={currentZoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="p-2 border border-secondary-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {zoomLevels.map(level => (
                <option key={level} value={level}>
                  {Math.round(level * 100)}%
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={onSavePdf}
            disabled={!isPdfLoaded || isProcessing}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-150 ease-in-out flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <><div className="loader-small w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Saving...</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Save PDF</>
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default Toolbar;
