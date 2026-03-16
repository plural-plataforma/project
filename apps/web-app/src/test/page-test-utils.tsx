import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/** QueryClient com retry desabilitado para testes rápidos */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

interface PageWrapperProps {
  children: React.ReactNode
  initialEntries?: string[]
  queryClient?: QueryClient
}

export function PageWrapper({
  children,
  initialEntries = ['/'],
  queryClient: client,
}: PageWrapperProps) {
  const qc = client ?? createTestQueryClient()
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

/** Renderiza componente de página com MemoryRouter e QueryClientProvider */
export function renderPage(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    initialEntries?: string[]
    queryClient?: QueryClient
  }
) {
  const { initialEntries = ['/'], queryClient, ...renderOptions } = options ?? {}
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PageWrapper initialEntries={initialEntries} queryClient={queryClient}>
      {children}
    </PageWrapper>
  )
  return render(ui, { wrapper, ...renderOptions })
}
