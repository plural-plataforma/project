import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { HomeRedirect } from './HomeRedirect'
import { AppShell } from '@/components/layout/AppShell'

// Auth + onboarding (small, not lazy-loaded for faster first paint)
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'

// Protected pages (lazy)
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const EscolasPage = lazy(() => import('@/pages/escola/EscolasPage'))
const AlunosPage = lazy(() => import('@/pages/aluno/AlunosPage'))
const AlunoProfilePage = lazy(() => import('@/pages/aluno/AlunoProfilePage'))
const PlanejamentosPage = lazy(() => import('@/pages/planejamento/PlanejamentosPage'))
const PlanejamentoDetailPage = lazy(() => import('@/pages/planejamento/PlanejamentoDetailPage'))
const AvaliacoesPage = lazy(() => import('@/pages/avaliacao/AvaliacoesPage'))
const AvaliacaoWizardPage = lazy(() => import('@/pages/avaliacao/AvaliacaoWizardPage'))
const AvaliacaoDesempenhoPage = lazy(() => import('@/pages/avaliacao/AvaliacaoDesempenhoPage'))
const PerfilPage = lazy(() => import('@/pages/professor/PerfilPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding — público, usuário logado vai para dashboard */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Public auth routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/escolas"
              element={
                <Suspense fallback={<PageLoader />}>
                  <EscolasPage />
                </Suspense>
              }
            />
            <Route
              path="/alunos"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AlunosPage />
                </Suspense>
              }
            />
            <Route
              path="/alunos/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AlunoProfilePage />
                </Suspense>
              }
            />
            <Route
              path="/planejamentos"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PlanejamentosPage />
                </Suspense>
              }
            />
            <Route
              path="/planejamentos/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PlanejamentoDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/avaliacoes"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AvaliacoesPage />
                </Suspense>
              }
            />
            <Route
              path="/avaliacoes/nova/:step?"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AvaliacaoWizardPage />
                </Suspense>
              }
            />
            <Route
              path="/avaliacoes/editar/:avaliacaoId/:step?"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AvaliacaoWizardPage />
                </Suspense>
              }
            />
            <Route
              path="/avaliacoes/:avaliacaoId/desempenho"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AvaliacaoDesempenhoPage />
                </Suspense>
              }
            />
            <Route path="/relatorios" element={<Navigate to="/avaliacoes" replace />} />
            <Route
              path="/perfil"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PerfilPage />
                </Suspense>
              }
            />
            <Route path="/alterar-senha" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
