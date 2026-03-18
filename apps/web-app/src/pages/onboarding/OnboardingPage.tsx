import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoriesOnboarding } from '@/components/onboarding/StoriesOnboarding'
import { useAuth } from '@/context/AuthContext'
import { useOnboardingStore } from '@/stores/onboardingStore'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { isLoggedIn, loading } = useAuth()
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)

  // Logado + já viu onboarding: redireciona para dashboard
  useEffect(() => {
    if (!loading && isLoggedIn && hasSeenOnboarding) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoggedIn, loading, hasSeenOnboarding, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh w-full flex flex-col md:flex-row md:items-center md:justify-center bg-muted p-0 md:p-4">
      <StoriesOnboarding isLoggedIn={isLoggedIn} />
    </div>
  )
}
