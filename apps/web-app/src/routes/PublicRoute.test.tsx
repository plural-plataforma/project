import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PublicRoute } from './PublicRoute'
import { useAuth } from '@/context/AuthContext'

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: false, loading: false } as any)
  })

  it('renderiza Outlet quando não autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: false, loading: false } as any)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redireciona para /dashboard quando autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: true, loading: false } as any)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('retorna null quando loading', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoggedIn: false, loading: true } as any)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })
})
