// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import ManagerDashboard from "./pages/ManagerDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Assignments from "./pages/Assignments";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
    <Toaster position="top-center" reverseOrder={false} />
      <Layout>
        <Routes>
          {/* Public login */}
          <Route path="/login" element={<Login />} />

          {/* Manager-only dashboard */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Engineer-only dashboard */}
          <Route
            path="/engineer"
            element={
              <ProtectedRoute allowedRoles={["engineer"]}>
                <EngineerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Manager-only: list of projects */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <Projects />
              </ProtectedRoute>
            }
          />

          {/* Manager-only: project details */}
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            }
          />
          {/* Any authenticated user can view assignments */}
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            }
          />

          {/* Fallback to login */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
