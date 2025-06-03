
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EditTool, type EditOperation, type EditsState, type TextEdit, type TextInputState, type TextInputValue, type BlurEdit, type EraseEdit } from './types';
import Toolbar from './components/Toolbar';
import PdfCanvas from './components/PdfCanvas';
import Pagination from './components/Pagination';
import TextInputModal from './components/TextInputModal';

const initialTextInputValue: TextInputValue = {
  text: '',
  fontSize: 16, // Default font size in PDF points
  fontFamily: 'Arial',
  color: '#000000',
};

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null); // from pdfjsLib.getDocument()
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<EditTool>(EditTool.CURSOR);
  const [edits, setEdits] = useState<EditsState>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1.5);
  const [textInputState, setTextInputState] = useState<TextInputState>({
    visible: false,
    x: 0,
    y: 0,
    currentValue: {...initialTextInputValue},
  });

  const pdfjsLibRef = useRef<any>(null);
  const jspdfRef = useRef<any>(null);

  useEffect(() => {
    // Ensure pdf.js worker is configured
    if (window.pdfjsLib) {
      pdfjsLibRef.current = window.pdfjsLib;
      pdfjsLibRef.current.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }
    if(window.jspdf) {
      jspdfRef.current = window.jspdf;
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
      setEdits([]); // Clear edits for new PDF
    } else {
      setPdfFile(null);
      setPdfDocProxy(null);
      setTotalPages(0);
      setCurrentPageNum(1);
      setError('Please upload a valid PDF file.');
      setEdits([]);
    }
  };

  useEffect(() => {
    if (!pdfFile || !pdfjsLibRef.current) return;

    const loadPdf = async () => {
      setIsProcessing(true);
      setError(null);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
            const loadingTask = pdfjsLibRef.current.getDocument({ data: typedArray });
            const pdf = await loadingTask.promise;
            setPdfDocProxy(pdf);
            setTotalPages(pdf.numPages);
            setCurrentPageNum(1);
          }
        };
        reader.readAsArrayBuffer(pdfFile);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. It might be corrupted or an unsupported format.');
        setPdfDocProxy(null);
        setTotalPages(0);
      } finally {
        setIsProcessing(false);
      }
    };
    loadPdf();
  }, [pdfFile]);

  const addEdit = useCallback((edit: EditOperation) => {
    setEdits((prevEdits) => [...prevEdits, edit]);
  }, []);
  
  const handleSavePdf = useCallback(async () => {
    if (!pdfDocProxy || !jspdfRef.current) return;

    setIsProcessing(true);
    setError(null);
    try {
      const { jsPDF } = jspdfRef.current;
      let newPdf: any = null; 
      const saveScale = Math.max(1.5, currentZoom); // Use current zoom or a minimum of 1.5 for quality

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDocProxy.getPage(i);
        
        // Viewport for actual PDF page dimensions (in points)
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        // Viewport for rendering to canvas (at saveScale)
        const renderViewport = page.getViewport({ scale: saveScale });

        const saveCanvas = document.createElement('canvas');
        saveCanvas.width = renderViewport.width;
        saveCanvas.height = renderViewport.height;
        const saveCanvasCtx = saveCanvas.getContext('2d');

        if (!saveCanvasCtx) {
          throw new Error('Could not get canvas context for saving.');
        }
        
        const renderContext = {
          canvasContext: saveCanvasCtx,
          viewport: renderViewport,
        };
        await page.render(renderContext).promise;

        // Apply edits for this page
        const pageEdits = edits.filter(edit => edit.pageNumber === i);
        pageEdits.forEach(editOp => {
          if (editOp.type === EditTool.BLUR || editOp.type === EditTool.ERASE) {
            const rectEdit = editOp as BlurEdit | EraseEdit;
            // PDF coordinates for top-left and bottom-right of the rectangle
            const pdfP1 = { x: rectEdit.x, y: rectEdit.y }; // Top-left in PDF space
            const pdfP2 = { x: rectEdit.x + rectEdit.width, y: rectEdit.y - rectEdit.height }; // Bottom-right in PDF space

            // Convert to canvas coordinates using renderViewport
            const [cvEditX, cvEditY] = renderViewport.convertToViewportPoint(pdfP1.x, pdfP1.y);
            const [cvBottomRightX, cvBottomRightY] = renderViewport.convertToViewportPoint(pdfP2.x, pdfP2.y);
            
            const cvEditWidth = Math.abs(cvBottomRightX - cvEditX);
            const cvEditHeight = Math.abs(cvBottomRightY - cvEditY);

            if (cvEditWidth > 0 && cvEditHeight > 0) {
                if (editOp.type === EditTool.BLUR) {
                    saveCanvasCtx.save();
                    const tempBlurCanvas = document.createElement('canvas');
                    tempBlurCanvas.width = cvEditWidth;
                    tempBlurCanvas.height = cvEditHeight;
                    const tempCtx = tempBlurCanvas.getContext('2d');
                    if(tempCtx) {
                        // Copy region from saveCanvas to temp canvas
                        tempCtx.drawImage(saveCanvas, cvEditX, cvEditY, cvEditWidth, cvEditHeight, 0, 0, cvEditWidth, cvEditHeight);
                        // Apply filter to temp canvas context
                        // Adjust blur radius slightly based on saveScale, ensure it's visible
                        const blurRadius = Math.max(2, 5 * saveScale / 1.5); 
                        tempCtx.filter = `blur(${blurRadius}px)`;
                        // Draw temp canvas back onto itself, applying the filter
                        tempCtx.drawImage(tempBlurCanvas, 0, 0);
                        // Draw the now-blurred temp canvas onto the saveCanvas
                        saveCanvasCtx.drawImage(tempBlurCanvas, cvEditX, cvEditY);
                    }
                    saveCanvasCtx.restore();
                } else if (editOp.type === EditTool.ERASE) {
                    saveCanvasCtx.fillStyle = 'white'; // Or try to match PDF background
                    saveCanvasCtx.fillRect(cvEditX, cvEditY, cvEditWidth, cvEditHeight);
                }
            }
          } else if (editOp.type === EditTool.TEXT) {
            const textEdit = editOp as TextEdit;
            const [cvEditX, cvEditY] = renderViewport.convertToViewportPoint(textEdit.x, textEdit.y);
            
            saveCanvasCtx.fillStyle = textEdit.color;
            const scaledFontSizeForSave = textEdit.fontSize * saveScale;
            saveCanvasCtx.font = `${scaledFontSizeForSave}px ${textEdit.fontFamily}`;
            saveCanvasCtx.textAlign = 'left';
            saveCanvasCtx.textBaseline = 'top';
            saveCanvasCtx.fillText(textEdit.text, cvEditX, cvEditY);
          }
        });
        
        const imgData = saveCanvas.toDataURL('image/png');

        if (i === 1) {
           newPdf = new jsPDF({
            orientation: unscaledViewport.width > unscaledViewport.height ? 'l' : 'p',
            unit: 'pt',
            format: [unscaledViewport.width, unscaledViewport.height]
          });
        } else if (newPdf) {
          newPdf.addPage([unscaledViewport.width, unscaledViewport.height], unscaledViewport.width > unscaledViewport.height ? 'l' : 'p');
        }
        
        if (newPdf) {
            // Add image to fill the entire unscaled PDF page dimensions
            newPdf.addImage(imgData, 'PNG', 0, 0, unscaledViewport.width, unscaledViewport.height);
        }
      }
      if (newPdf) {
        newPdf.save('edited_document.pdf');
      } else {
        setError("Failed to create PDF document.");
      }
    } catch (err) {
      console.error('Error saving PDF:', err);
      setError(`Failed to save PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  }, [pdfDocProxy, totalPages, edits, currentZoom]);

  const handleOpenTextModal = (canvasX: number, canvasY: number, pdfX: number, pdfY: number) => {
    setTextInputState({
      visible: true,
      x: canvasX,
      y: canvasY,
      pdfX: pdfX,
      pdfY: pdfY,
      pageNumber: currentPageNum,
      currentValue: {...initialTextInputValue}
    });
  };

  const handleCloseTextModal = () => {
    setTextInputState(prev => ({ ...prev, visible: false, currentValue: {...initialTextInputValue} }));
  };

  const handleConfirmText = (value: TextInputValue) => {
    if (textInputState.pdfX === undefined || textInputState.pdfY === undefined || textInputState.pageNumber === undefined || !value.text.trim()) {
      handleCloseTextModal();
      return;
    }
    const newTextEdit: TextEdit = {
      id: `text-${Date.now()}`,
      type: EditTool.TEXT,
      pageNumber: textInputState.pageNumber,
      x: textInputState.pdfX,
      y: textInputState.pdfY,
      text: value.text,
      fontSize: value.fontSize,
      fontFamily: value.fontFamily,
      color: value.color,
    };
    addEdit(newTextEdit);
    handleCloseTextModal();
  };


  const pageContainerClass = selectedTool === EditTool.BLUR || selectedTool === EditTool.ERASE ? 'cursor-crosshair' : selectedTool === EditTool.TEXT ? 'cursor-text' : 'cursor-default';

  return (
    <div className="flex flex-col h-screen antialiased">
      <header className="bg-primary-700 text-white p-4 shadow-md">
        <h1 className="text-2xl font-semibold">React PDF Editor</h1>
      </header>

      <Toolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onFileUpload={handleFileUpload}
        onSavePdf={handleSavePdf}
        isPdfLoaded={!!pdfDocProxy}
        isProcessing={isProcessing}
        currentZoom={currentZoom}
        onZoomChange={setCurrentZoom}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isProcessing && !pdfDocProxy && (
         <div className="flex-grow flex items-center justify-center">
            <div className="loader"></div>
            <p className="ml-4 text-lg text-secondary-700">Loading PDF...</p>
         </div>
      )}


      <main className={`flex-grow flex flex-col items-center justify-center p-4 overflow-hidden ${pageContainerClass}`}>
        {pdfDocProxy ? (
          <>
            <div className="pdf-canvas-container bg-white shadow-lg">
              <PdfCanvas
                pdfDocProxy={pdfDocProxy}
                pageNum={currentPageNum}
                selectedTool={selectedTool}
                addEdit={addEdit}
                edits={edits.filter(edit => edit.pageNumber === currentPageNum)}
                zoom={currentZoom}
                onTextToolClick={handleOpenTextModal}
              />
            </div>
            <Pagination
              currentPage={currentPageNum}
              totalPages={totalPages}
              onPageChange={setCurrentPageNum}
            />
          </>
        ) : (
          !isProcessing && (
            <div className="text-center p-10 border-2 border-dashed border-secondary-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-secondary-400 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-xl text-secondary-600">Upload a PDF to start editing.</p>
              <p className="text-sm text-secondary-500 mt-1">Your document stays on your device. No server uploads for processing.</p>
            </div>
          )
        )}
      </main>
      
      {textInputState.visible && (
        <TextInputModal
          initialValue={textInputState.currentValue}
          onConfirm={handleConfirmText}
          onCancel={handleCloseTextModal}
          positionX={textInputState.x}
          positionY={textInputState.y}
        />
      )}

      {isProcessing && pdfDocProxy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center">
            <div className="loader"></div>
            <p className="ml-4 text-lg text-secondary-700">Saving PDF...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
