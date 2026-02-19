import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function RequireAdmin() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded: any = jwtDecode(token);

    // Mesma chave usada no backend
    const roleClaimKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = decoded[roleClaimKey];

    const isAdmin = role && role.toString().toLowerCase() === 'admin';

    console.log('[RequireAdmin] Role detectada:', role);   // ← debug importante
    console.log('[RequireAdmin] É Admin?', isAdmin);

    if (!isAdmin) {
      return <Navigate to="/acesso-restrito" replace />;
    }

    return <Outlet />;
  } catch (error) {
    console.error('[RequireAdmin] Erro ao decodificar token:', error);
    return <Navigate to="/login" replace />;
  }
}