
export enum EditTool {
  CURSOR = 'cursor',
  BLUR = 'blur',
  ERASE = 'erase',
  TEXT = 'text',
}

export interface BaseEdit {
  id: string;
  pageNumber: number;
}

export interface RectangularEdit extends BaseEdit {
  x: number; // in PDF points, relative to page
  y: number; // in PDF points, relative to page
  width: number; // in PDF points
  height: number; // in PDF points
}

export interface BlurEdit extends RectangularEdit {
  type: EditTool.BLUR;
}

export interface EraseEdit extends RectangularEdit {
  type: EditTool.ERASE;
}

export interface TextEdit extends BaseEdit {
  type: EditTool.TEXT;
  x: number; // in PDF points, relative to page (top-left of text)
  y: number; // in PDF points, relative to page (top-left of text)
  text: string;
  fontSize: number; // in PDF points
  fontFamily: string;
  color: string;
  // width and height can be calculated via measureText if needed for bounding box
}

export type EditOperation = BlurEdit | EraseEdit | TextEdit;

export type EditsState = EditOperation[];

// For pdf.js and jsPDF global objects
declare global {
  interface Window {
    pdfjsLib: any;
    jspdf: any;
  }
}

export interface TextInputValue {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface TextInputState {
  visible: boolean;
  x: number; // Canvas coordinates for positioning modal
  y: number; // Canvas coordinates for positioning modal
  pageNumber?: number; // Page number this text belongs to
  pdfX?: number; // PDF coordinate
  pdfY?: number; // PDF coordinate
  currentValue: TextInputValue;
}

