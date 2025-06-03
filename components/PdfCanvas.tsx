import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EditTool, type EditOperation, type TextEdit } from '../types';

interface PdfCanvasProps {
  pdfDocProxy: any; // PDFDocumentProxy from pdf.js
  pageNum: number;
  selectedTool: EditTool;
  addEdit: (edit: EditOperation) => void;
  edits: EditOperation[];
  zoom: number;
  onTextToolClick: (canvasX: number, canvasY: number, pdfX: number, pdfY: number) => void;
}

const PdfCanvas: React.FC<PdfCanvasProps> = ({
  pdfDocProxy,
  pageNum,
  selectedTool,
  addEdit,
  edits,
  zoom,
  onTextToolClick
}) => {
  const visibleCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRenderTaskRef = useRef<any>(null); // For page.render() on offscreen canvas
  const pageViewportRef = useRef<any>(null); // Store the latest viewport

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Effect 1: Render PDF page and persistent edits to offscreen canvas
  useEffect(() => {
    if (!pdfDocProxy || !pageNum) return;

    let isActive = true; // To handle component unmount or dependency change during async ops

    const renderToOffscreen = async () => {
      if (pdfRenderTaskRef.current) {
        pdfRenderTaskRef.current.cancel();
        pdfRenderTaskRef.current = null;
      }

      try {
        const page = await pdfDocProxy.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });
        pageViewportRef.current = viewport; // Store for coordinate conversion

        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offscreenCanvas = offscreenCanvasRef.current;
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');

        if (!offscreenCtx || !isActive) return;

        const renderContext = { canvasContext: offscreenCtx, viewport: viewport };
        pdfRenderTaskRef.current = page.render(renderContext);
        await pdfRenderTaskRef.current.promise;
        
        if (!isActive) { // Check again after await
          pdfRenderTaskRef.current = null; // Ensure task is cleared if component became inactive
          return; 
        }
        pdfRenderTaskRef.current = null;

        // Apply persistent edits to offscreen canvas
        edits.forEach(edit => {
           const [cvEditX, cvEditY] = viewport.convertToViewportPoint(edit.x, edit.y);
           let cvEditWidth: number | undefined, cvEditHeight: number | undefined;

            if (edit.type === EditTool.BLUR || edit.type === EditTool.ERASE) {
                const rectEdit = edit as EditOperation & {width: number, height: number};
                // Convert bottom-right point of the PDF rect to viewport coordinates to get width/height
                const [cvBottomRightX, cvBottomRightY] = viewport.convertToViewportPoint(rectEdit.x + rectEdit.width, rectEdit.y - rectEdit.height); // PDF y is from bottom for height calc
                
                // Calculate width and height in viewport space
                // Note: convertToViewportPoint maps PDF y (bottom-up) to canvas y (top-down)
                // So edit.y (top PDF y) -> cvEditY (top canvas y)
                // edit.y - edit.height (bottom PDF y) -> some canvas y_bottom
                // cvEditHeight = canvas y_bottom - cvEditY
                // A simpler way is to use distances, but viewport.convertToViewportPoint handles transformations.
                // The original `edit.y + edit.height` was wrong if PDF y is from bottom.
                // For width: (edit.x + edit.width) -> cvBottomRightX. cvEditWidth = cvBottomRightX - cvEditX
                // For height: (edit.y (top y_pdf), edit.y - edit.height (bottom y_pdf))
                // Point (edit.x, edit.y - edit.height) is bottom-left of PDF rect.
                // Let P_tl_pdf = (edit.x, edit.y)
                // Let P_br_pdf = (edit.x + edit.width, edit.y - edit.height)
                // [cv_tl_x, cv_tl_y] = viewport.convertToViewportPoint(P_tl_pdf.x, P_tl_pdf.y) (this is cvEditX, cvEditY)
                // [cv_br_x, cv_br_y] = viewport.convertToViewportPoint(P_br_pdf.x, P_br_pdf.y)
                // cvEditWidth = cv_br_x - cv_tl_x;
                // cvEditHeight = cv_br_y - cv_tl_y;
                // This should be correct:
                const [x0, y0] = viewport.convertToViewportPoint(edit.x, edit.y); // Top-left in PDF -> canvas
                const [x1, y1] = viewport.convertToViewportPoint(edit.x + rectEdit.width, edit.y - rectEdit.height); // Bottom-right in PDF -> canvas
                cvEditWidth = Math.abs(x1 - x0);
                cvEditHeight = Math.abs(y1 - y0);
            }


            if (edit.type === EditTool.BLUR && cvEditWidth !== undefined && cvEditHeight !== undefined) {
                offscreenCtx.save();
                const tempBlurCanvas = document.createElement('canvas');
                tempBlurCanvas.width = cvEditWidth;
                tempBlurCanvas.height = cvEditHeight;
                const tempCtx = tempBlurCanvas.getContext('2d');
                if(tempCtx) {
                    // Copy region from offscreen (which has PDF + previous edits) to temp canvas
                    tempCtx.drawImage(offscreenCanvas, cvEditX, cvEditY, cvEditWidth, cvEditHeight, 0, 0, cvEditWidth, cvEditHeight);
                    // Apply filter to temp canvas context
                    tempCtx.filter = 'blur(5px)';
                    // Draw temp canvas back onto itself, applying the filter
                    tempCtx.drawImage(tempBlurCanvas, 0, 0);
                    // Draw the now-blurred temp canvas onto the offscreen canvas
                    offscreenCtx.drawImage(tempBlurCanvas, cvEditX, cvEditY);
                }
                offscreenCtx.restore();
            } else if (edit.type === EditTool.ERASE && cvEditWidth !== undefined && cvEditHeight !== undefined) {
                offscreenCtx.fillStyle = 'white'; 
                offscreenCtx.fillRect(cvEditX, cvEditY, cvEditWidth, cvEditHeight);
            } else if (edit.type === EditTool.TEXT) {
                const textEdit = edit as TextEdit;
                offscreenCtx.fillStyle = textEdit.color;
                const scaledFontSize = textEdit.fontSize * zoom; 
                offscreenCtx.font = `${scaledFontSize}px ${textEdit.fontFamily}`;
                offscreenCtx.textAlign = 'left';
                offscreenCtx.textBaseline = 'top'; // Assuming edit.y is the top of the text
                offscreenCtx.fillText(textEdit.text, cvEditX, cvEditY);
            }
        });

        if (isActive) {
          // Trigger re-draw of visible canvas
          drawVisibleCanvas();
        }

      } catch (error: any) {
        if (error.name === 'RenderingCancelledException' || (typeof error.message === 'string' && error.message.includes('Rendering cancelled'))) {
          // This is expected if the task is cancelled, log for debug but don't show error
          console.log(`Offscreen rendering for page ${pageNum} cancelled.`);
        } else {
          console.error(`Error in offscreen rendering page ${pageNum}:`, error);
        }
        pdfRenderTaskRef.current = null; // Ensure ref is cleared on error too
      }
    };

    renderToOffscreen();

    return () => {
      isActive = false;
      if (pdfRenderTaskRef.current) {
        pdfRenderTaskRef.current.cancel();
        pdfRenderTaskRef.current = null;
      }
    };
  }, [pdfDocProxy, pageNum, zoom, edits]); // Removed selectedTool, isDrawing, currentRect from here


  const drawVisibleCanvas = useCallback(() => {
    const visibleCanvas = visibleCanvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    const viewport = pageViewportRef.current;

    if (!visibleCanvas || !offscreenCanvas || !viewport ) {
        // If viewport is not ready, we can't set visible canvas dimensions correctly.
        // If offscreen is not ready, there's nothing to draw yet.
        if(visibleCanvas && !viewport && pdfDocProxy){ // Pdf loaded but first page/viewport not ready
             const ctx = visibleCanvas.getContext('2d');
             if(ctx) {
                visibleCanvas.width = visibleCanvas.parentElement?.clientWidth || 300; // Fallback width
                visibleCanvas.height = visibleCanvas.parentElement?.clientHeight || 150; // Fallback height
                ctx.clearRect(0,0, visibleCanvas.width, visibleCanvas.height);
                ctx.fillText("Loading page...", 10, 20);
             }
        }
        return;
    }
    
    // Ensure visible canvas has correct dimensions from latest viewport
    if (visibleCanvas.width !== viewport.width) visibleCanvas.width = viewport.width;
    if (visibleCanvas.height !== viewport.height) visibleCanvas.height = viewport.height;

    const visibleCtx = visibleCanvas.getContext('2d');
    if (!visibleCtx) return;

    visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
    visibleCtx.drawImage(offscreenCanvas, 0, 0);

    if (isDrawing && currentRect && (selectedTool === EditTool.BLUR || selectedTool === EditTool.ERASE)) {
      visibleCtx.strokeStyle = selectedTool === EditTool.BLUR ? 'rgba(0, 0, 255, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      visibleCtx.lineWidth = 2;
      visibleCtx.setLineDash([5, 5]);
      visibleCtx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      visibleCtx.setLineDash([]);
    }
  }, [isDrawing, currentRect, selectedTool, pdfDocProxy]); // Added pdfDocProxy to re-evaluate if it changes (e.g. new file)

  useEffect(() => {
    drawVisibleCanvas();
  }, [drawVisibleCanvas]);


  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = visibleCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== EditTool.BLUR && selectedTool !== EditTool.ERASE) return;
    const coords = getCanvasCoordinates(event);
    if (!coords || !pageViewportRef.current) return; // Need viewport to ensure interactions are valid
    
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || (selectedTool !== EditTool.BLUR && selectedTool !== EditTool.ERASE)) return;
    const coords = getCanvasCoordinates(event);
    if (!coords || !pageViewportRef.current) return;

    setCurrentRect({
      x: Math.min(startPos.x, coords.x),
      y: Math.min(startPos.y, coords.y),
      width: Math.abs(startPos.x - coords.x),
      height: Math.abs(startPos.y - coords.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || !startPos || !pageViewportRef.current || (selectedTool !== EditTool.BLUR && selectedTool !== EditTool.ERASE)) {
      if(isDrawing) setIsDrawing(false); // Ensure drawing state is reset
      if(startPos) setStartPos(null);
      return;
    }
    
    const viewport = pageViewportRef.current;
    // Canvas coordinates of the selection rectangle's top-left and bottom-right corners
    const canvasP1 = { x: currentRect.x, y: currentRect.y };
    const canvasP2 = { x: currentRect.x + currentRect.width, y: currentRect.y + currentRect.height };

    // Convert these canvas coordinates to PDF coordinates
    const [pdfP1x, pdfP1y] = viewport.convertToPdfPoint(canvasP1.x, canvasP1.y);
    const [pdfP2x, pdfP2y] = viewport.convertToPdfPoint(canvasP2.x, canvasP2.y);

    // In PDF user space (Y increases upwards):
    // pdfP1y corresponds to the top edge of the selection (higher Y value).
    // pdfP2y corresponds to the bottom edge of the selection (lower Y value).
    const pdfRect = {
        x: Math.min(pdfP1x, pdfP2x),
        y: Math.max(pdfP1y, pdfP2y), // Y-coordinate of the top edge in PDF space
        width: Math.abs(pdfP1x - pdfP2x),
        height: Math.abs(pdfP1y - pdfP2y)
    };
    
    if (pdfRect.width > 0 && pdfRect.height > 0) {
      const newEdit: EditOperation = selectedTool === EditTool.BLUR
        ? { id: `blur-${Date.now()}`, type: EditTool.BLUR, pageNumber: pageNum, ...pdfRect }
        : { id: `erase-${Date.now()}`, type: EditTool.ERASE, pageNumber: pageNum, ...pdfRect };
      addEdit(newEdit);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null); 
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== EditTool.TEXT || !pageViewportRef.current) return;
    const canvasCoords = getCanvasCoordinates(event);
    if (!canvasCoords) return;

    const viewport = pageViewportRef.current;
    const [pdfX, pdfY] = viewport.convertToPdfPoint(canvasCoords.x, canvasCoords.y);
    // For TextEdit, 'y' is defined as "top-left of text".
    // pdfY from convertToPdfPoint is the y-coordinate in PDF user space (origin bottom-left, y increases upwards).
    // This should correspond to the clicked point, which can be used as the top-left y for text if textBaseline is 'top'.
    onTextToolClick(canvasCoords.x, canvasCoords.y, pdfX, pdfY);
  };
  
  let cursorClass = 'cursor-default';
  if(selectedTool === EditTool.CURSOR) cursorClass = 'cursor-default';
  else if(selectedTool === EditTool.BLUR || selectedTool === EditTool.ERASE) cursorClass = 'cursor-crosshair';
  else if(selectedTool === EditTool.TEXT) cursorClass = 'cursor-text';


  return <canvas ref={visibleCanvasRef} className={cursorClass} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleClick} />;
};

export default PdfCanvas;
