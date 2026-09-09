import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useTermosPendentes } from '@/hooks/useTermosPendentes'

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/stores/onboardingStore', () => ({
  useOnboardingStore: vi.fn((selector: (s: { hasSeenOnboarding: boolean }) => unknown) => {
    const state = { hasSeenOnboarding: true }
    return typeof selector === 'function' ? selector(state) : state
  }),
}))

vi.mock('@/hooks/useTermosPendentes', () => ({
  useTermosPendentes: vi.fn(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: true, loading: false } as any)
    vi.mocked(useOnboardingStore).mockImplementation((selector) => {
      const state = { hasSeenOnboarding: true }
      return typeof selector === 'function' ? selector(state) : state
    })
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [],
      isLoading: false,
      isError: false,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)
  })

  it('renderiza Outlet quando autenticado e já viu onboarding', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: true, loading: false } as any)
    vi.mocked(useOnboardingStore).mockImplementation((selector) => {
      const state = { hasSeenOnboarding: true }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('redireciona para /login quando não autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: false, loading: false } as any)
    vi.mocked(useOnboardingStore).mockImplementation((selector) => {
      const state = { hasSeenOnboarding: false }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redireciona para /onboarding quando autenticado mas não viu onboarding', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: true, loading: false } as any)
    vi.mocked(useOnboardingStore).mockImplementation((selector) => {
      const state = { hasSeenOnboarding: false }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/onboarding" element={<div>Onboarding</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Onboarding')).toBeInTheDocument()
  })

  it('exibe loading quando loading=true', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: false, loading: true } as any)
    vi.mocked(useOnboardingStore).mockImplementation((selector) => {
      const state = { hasSeenOnboarding: false }
      return typeof selector === 'function' ? selector(state) : state
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('redireciona para /aceitar-termos quando há termo pendente', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [{ termoVersaoId: 1, chave: 'uso_ferramenta', nome: 'Termos', versao: 1, texto: '<p>x</p>' }],
      isLoading: false,
      isError: false,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/aceitar-termos" element={<div>Aceitar Termos</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Aceitar Termos')).toBeInTheDocument()
  })

  it('não bloqueia quando a checagem de termos falha (fail-open)', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [],
      isLoading: false,
      isError: true,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })
})
