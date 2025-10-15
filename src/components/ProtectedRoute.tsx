// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLocalAuthed } from "@/lib/localAuth";

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const localAuth = isLocalAuthed();
  const isOnLogin = location.pathname === "/login";

  if (localAuth) return <Outlet />;
  if (isOnLogin) return null;
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
};

export default ProtectedRoute;
