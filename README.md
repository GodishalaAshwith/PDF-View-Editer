# PDF View Editor

A modern web application for viewing and editing PDF files built with React and Vite.

## Features

- **PDF Viewing**: Upload and view PDF files with smooth navigation
- **Text Editing**: Add new text to PDF documents
- **Text Manipulation**: Blur or erase sensitive text
- **Navigation Controls**: Page navigation and zoom controls
- **Modern UI**: Clean and responsive interface built with Tailwind CSS

## Tech Stack

- **React**: Frontend framework
- **Vite**: Build tool and development server
- **@react-pdf-viewer/core**: PDF viewing capabilities
- **pdf-lib**: PDF manipulation library
- **Tailwind CSS**: Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm 9.0 or later

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

1. **Upload PDF**: Click the "Upload" button to load a PDF file
2. **View PDF**: Navigate through pages using the controls
3. **Edit PDF**:
   - Click "Add Text" to insert new text
   - Use "Blur Text" to obscure sensitive information
   - Use "Erase Text" to remove text
4. **Save**: Changes are automatically applied to the PDF

## Project Structure

```
src/
  ├── components/      # Reusable UI components
  ├── context/        # React context for state management
  ├── Pages/          # Page components
  └── App.jsx         # Main application component
```

## License

This project is open source and available under the MIT License.
