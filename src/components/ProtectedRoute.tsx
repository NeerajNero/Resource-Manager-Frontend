// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ("engineer" | "manager")[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { token, user } = useAuthStore();

  // 1) If not logged in, redirect to /login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2) If roles are specified and user’s role is not in allowedRoles, redirect
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === "manager" ? "/manager" : "/engineer";
    return <Navigate to={redirectPath} replace />;
  }

  // 3) Otherwise, render the child component
  return children;
};

export default ProtectedRoute;
