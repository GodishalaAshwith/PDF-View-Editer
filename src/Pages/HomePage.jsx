import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-3xl mx-auto px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          PDF Viewer & Editor
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          View and edit your PDF documents with ease
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/upload"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload PDF
          </Link>
          <Link
            to="/editor"
            className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Go to Editor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
