// components/ProtectedRoutes.tsx (ou ProtectedLayout.tsx)

import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoutes() {
  const tokenLocal = localStorage.getItem("token");
  const tokenSession = sessionStorage.getItem("token");
  const token = tokenLocal || tokenSession;

  // Limpa tokens vazios (boa prática)
  if (!tokenLocal) localStorage.removeItem("token");
  if (!tokenSession) sessionStorage.removeItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Renderiza a rota filha (dashboard, skills, etc.)
  return <Outlet />;
}