import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">PDF Editor</div>
        <div className="flex gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-blue-400 hover:text-blue-300"
                : "hover:text-gray-300"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/upload"
            className={({ isActive }) =>
              isActive
                ? "text-blue-400 hover:text-blue-300"
                : "hover:text-gray-300"
            }
          >
            Upload
          </NavLink>
          <NavLink
            to="/editor"
            className={({ isActive }) =>
              isActive
                ? "text-blue-400 hover:text-blue-300"
                : "hover:text-gray-300"
            }
          >
            Editor
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
