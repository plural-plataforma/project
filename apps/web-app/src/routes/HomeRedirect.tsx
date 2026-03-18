import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function HomeRedirect() {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}
