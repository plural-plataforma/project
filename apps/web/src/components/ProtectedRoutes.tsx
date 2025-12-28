// components/ProtectedRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";

// Não precisa mais de interface com children
// interface ProtectedRouteProps { children: ReactNode; }  ← REMOVA ISSO

export default function ProtectedRoutes() {
  const tokenLocal = localStorage.getItem("token");
  const tokenSession = sessionStorage.getItem("token");
  const token = tokenLocal || tokenSession;

  // Limpa tokens inválidos
  if (!tokenLocal) localStorage.removeItem("token");
  if (!tokenSession) sessionStorage.removeItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Renderiza as rotas filhas (dashboard, skills, etc.)
  return <Outlet />;
}