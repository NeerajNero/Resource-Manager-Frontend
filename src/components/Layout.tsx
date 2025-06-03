// src/components/Layout.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Menu, X } from "lucide-react";
import toast from "react-hot-toast";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
    toast.success("Logged out successfully!")
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/manager" className="text-xl font-bold">
            Resource Manager
          </Link>

          {/* Hamburger for mobile */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop / wider screens nav */}
          <nav className="hidden md:flex md:space-x-4 items-center mobile-menu">
            {user ? (
              <>
                {user.role === "manager" ? (
                  <>
                    <Link to="/manager" className="hover:underline">
                      Dashboard
                    </Link>
                    <Link to="/projects" className="hover:underline">
                      Projects
                    </Link>
                    <Link to="/assignments" className="hover:underline">
                      Assignments
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/engineer" className="hover:underline">
                      My Dashboard
                    </Link>
                    <Link to="/assignments" className="hover:underline">
                      My Assignments
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:underline">
                Login
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile menu (shown only when menuOpen=true) */}
        {menuOpen && (
          <nav className="md:hidden bg-white border-t border-gray-200">
            <ul className="flex flex-col space-y-2 px-4 py-3">
              {user ? (
                <>
                  {user.role === "manager" ? (
                    <>
                      <li>
                        <Link
                          to="/manager"
                          onClick={() => setMenuOpen(false)}
                          className="block"
                        >
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/projects"
                          onClick={() => setMenuOpen(false)}
                          className="block"
                        >
                          Projects
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/assignments"
                          onClick={() => setMenuOpen(false)}
                          className="block"
                        >
                          Assignments
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link
                          to="/engineer"
                          onClick={() => setMenuOpen(false)}
                          className="block"
                        >
                          My Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/assignments"
                          onClick={() => setMenuOpen(false)}
                          className="block"
                        >
                          My Assignments
                        </Link>
                      </li>
                    </>
                  )}
                  <li>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-left w-full text-red-600"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block"
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">{children}</main>
    </div>
  );
};

export default Layout;
