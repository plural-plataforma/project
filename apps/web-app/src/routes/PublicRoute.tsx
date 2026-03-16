import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function PublicRoute() {
  const { isLoggedIn, loading } = useAuth()

  if (loading) return null

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
