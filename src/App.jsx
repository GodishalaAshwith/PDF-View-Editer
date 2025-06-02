import { useState } from "react";
import "./App.css";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import UploadPage from "./Pages/UploadPage";
import EditorPage from "./Pages/EditorPage";
import Layout from "./components/Layout";
import { PDFProvider } from "./context/PDFContext";

function App() {
  const [count, setCount] = useState(0);

  return (
    <PDFProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/editor" element={<EditorPage />} />
          </Route>
        </Routes>
      </Router>
    </PDFProvider>
  );
}

export default App;
