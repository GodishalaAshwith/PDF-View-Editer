
import React, { useState, useEffect, useRef } from 'react';
import { type TextInputValue } from '../types';

interface TextInputModalProps {
  initialValue: TextInputValue;
  onConfirm: (value: TextInputValue) => void;
  onCancel: () => void;
  positionX: number; // For positioning the modal, canvas coordinates
  positionY: number;
}

const fontFamilies = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS'];
const fontSizes = [8, 10, 12, 14, 16, 18, 24, 32, 48];

const TextInputModal: React.FC<TextInputModalProps> = ({ initialValue, onConfirm, onCancel, positionX, positionY }) => {
  const [textValue, setTextValue] = useState<TextInputValue>(initialValue);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTextValue(initialValue);
  }, [initialValue]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (textValue.text.trim()) {
      onConfirm(textValue);
    } else {
      // Optionally show an error or just close
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTextValue(prev => ({
      ...prev,
      [name]: name === 'fontSize' ? parseInt(value, 10) : value,
    }));
  };
  
  // Basic modal positioning logic - can be improved
  const modalStyle: React.CSSProperties = {
    position: 'fixed', // Use fixed to position relative to viewport
    left: `${positionX}px`,
    top: `${positionY}px`,
    transform: 'translate(-10px, 10px)', // Offset slightly so cursor isn't directly over modal
    zIndex: 1000,
  };


  return (
    <div ref={modalRef} style={modalStyle} className="bg-white p-6 rounded-lg shadow-xl border border-secondary-300 w-80">
      <form onSubmit={handleConfirm}>
        <h3 className="text-lg font-semibold mb-4 text-secondary-800">Add Text</h3>
        
        <div className="mb-4">
          <label htmlFor="text-input" className="block text-sm font-medium text-secondary-700 mb-1">Text</label>
          <textarea
            id="text-input"
            name="text"
            value={textValue.text}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="font-family-select" className="block text-sm font-medium text-secondary-700 mb-1">Font</label>
            <select
              id="font-family-select"
              name="fontFamily"
              value={textValue.fontFamily}
              onChange={handleChange}
              className="w-full p-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {fontFamilies.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="font-size-select" className="block text-sm font-medium text-secondary-700 mb-1">Size (pt)</label>
            <select
              id="font-size-select"
              name="fontSize"
              value={textValue.fontSize}
              onChange={handleChange}
              className="w-full p-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {fontSizes.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="color-input" className="block text-sm font-medium text-secondary-700 mb-1">Color</label>
          <input
            type="color"
            id="color-input"
            name="color"
            value={textValue.color}
            onChange={handleChange}
            className="w-full h-10 p-1 border border-secondary-300 rounded-md"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-md border border-secondary-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
          >
            Add Text
          </button>
        </div>
      </form>
    </div>
  );
};

export default TextInputModal;
