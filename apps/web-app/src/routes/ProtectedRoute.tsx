import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useOnboardingStore } from '@/stores/onboardingStore'

export function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth()
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Primeira vez logado: redireciona para onboarding antes de acessar a app
  if (!hasSeenOnboarding) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ destination: location.pathname || '/dashboard' }}
      />
    )
  }

  return <Outlet />
}
