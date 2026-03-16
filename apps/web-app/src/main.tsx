import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { AppRouter } from '@/routes'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from '@/components/ui/toaster'
import { initTheme } from '@/hooks/useTheme'
import './index.css'

// Aplica o tema salvo antes do primeiro render — elimina flash (FOUC)
initTheme()

// Mobile: ao abrir teclado virtual, mantém input focado visível
if (typeof window !== 'undefined' && window.visualViewport) {
  let lastHeight = window.visualViewport.height
  const handleViewportResize = () => {
    const vv = window.visualViewport
    if (vv.height < lastHeight) {
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
    lastHeight = vv.height
  }
  window.visualViewport.addEventListener('resize', handleViewportResize)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
