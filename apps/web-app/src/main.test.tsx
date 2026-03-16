import { describe, it, expect } from 'vitest'
import { createRoot } from 'react-dom/client'
import { initTheme } from '@/hooks/useTheme'
import { AppRouter } from '@/routes'
import { AuthProvider } from '@/context/AuthContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from '@/components/ui/toaster'

/**
 * Testes do bootstrap da aplicação (dependências do main.tsx).
 * main.tsx não exporta nada; apenas monta a árvore. Verificamos que
 * todos os módulos do bootstrap carregam corretamente.
 */
describe('main (bootstrap)', () => {
  it('dependências do mount estão disponíveis', () => {
    expect(typeof createRoot).toBe('function')
    expect(typeof initTheme).toBe('function')
    expect(typeof AppRouter).toBe('function')
    expect(typeof AuthProvider).toBe('function')
    expect(typeof QueryClientProvider).toBe('function')
    expect(typeof Toaster).toBe('function')
    expect(queryClient).toBeDefined()
  })
})
