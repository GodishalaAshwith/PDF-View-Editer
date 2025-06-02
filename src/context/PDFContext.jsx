import { createContext, useContext, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const PDFContext = createContext();

export const usePDFContext = () => useContext(PDFContext);

export const PDFProvider = ({ children }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState('view');
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);

  const loadPDF = async (file) => {
    try {
      setIsLoading(true);
      // Create URL for viewer
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setPdfFile(file);

      // Load PDF document for editing
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdfDoc);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
      return false;
    }
  };

  const clearPDF = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setPdfFile(null);
    setPdfDoc(null);
    setFileUrl(null);
    setCurrentPage(1);
    setEditMode('view');
  };

  const blurText = async (coordinates) => {
    if (!pdfDoc) return;
    try {
      const page = pdfDoc.getPages()[currentPage - 1];
      page.drawRectangle({
        x: coordinates.x,
        y: page.getHeight() - coordinates.y - coordinates.height,
        width: coordinates.width,
        height: coordinates.height,
        color: { r: 0.9, g: 0.9, b: 0.9 },
        opacity: 0.8,
      });
      
      const modifiedPdf = await pdfDoc.save();
      const blob = new Blob([modifiedPdf], { type: 'application/pdf' });
      const newFile = new File([blob], pdfFile.name, { type: 'application/pdf' });
      
      // Update both the file and URL
      const newUrl = URL.createObjectURL(newFile);
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      setFileUrl(newUrl);
      setPdfFile(newFile);
    } catch (error) {
      console.error('Error blurring text:', error);
    }
  };

  const eraseText = async (coordinates) => {
    if (!pdfDoc) return;
    try {
      const page = pdfDoc.getPages()[currentPage - 1];
      page.drawRectangle({
        x: coordinates.x,
        y: page.getHeight() - coordinates.y - coordinates.height,
        width: coordinates.width,
        height: coordinates.height,
        color: { r: 1, g: 1, b: 1 },
        opacity: 1,
      });
      
      const modifiedPdf = await pdfDoc.save();
      const blob = new Blob([modifiedPdf], { type: 'application/pdf' });
      const newFile = new File([blob], pdfFile.name, { type: 'application/pdf' });
      
      // Update both the file and URL
      const newUrl = URL.createObjectURL(newFile);
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      setFileUrl(newUrl);
      setPdfFile(newFile);
    } catch (error) {
      console.error('Error erasing text:', error);
    }
  };

  const addText = async (text, coordinates) => {
    if (!pdfDoc) return;
    try {
      const page = pdfDoc.getPages()[currentPage - 1];
      page.drawText(text, {
        x: coordinates.x,
        y: page.getHeight() - coordinates.y,
        size: 12,
        color: { r: 0, g: 0, b: 0 },
      });
      
      const modifiedPdf = await pdfDoc.save();
      const blob = new Blob([modifiedPdf], { type: 'application/pdf' });
      const newFile = new File([blob], pdfFile.name, { type: 'application/pdf' });
      
      // Update both the file and URL
      const newUrl = URL.createObjectURL(newFile);
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      setFileUrl(newUrl);
      setPdfFile(newFile);
    } catch (error) {
      console.error('Error adding text:', error);
    }
  };

  return (
    <PDFContext.Provider
      value={{
        pdfFile,
        pdfDoc,
        fileUrl,
        currentPage,
        editMode,
        isLoading,
        setEditMode,
        setCurrentPage,
        loadPDF,
        clearPDF,
        blurText,
        eraseText,
        addText,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
};