import { useState } from "react";
import "./App.css";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import UploadPage from "./Pages/UploadPage";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
