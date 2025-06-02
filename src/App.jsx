import { useState } from "react";
import "./App.css";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import UploadPage from "./Pages/UploadPage";
import EditorPage from "./Pages/EditorPage";
import Layout from "./components/Layout";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<UploadPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/editor" element={<EditorPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
