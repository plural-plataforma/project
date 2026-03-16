import { describe, it, expect } from 'vitest'
import App from './App'

/**
 * Testes da App (entrada da aplicação).
 * Nota: App.tsx é o template Vite padrão; a aplicação real usa main.tsx + AppRouter.
 * Smoke test: verificação de export.
 */
describe('App', () => {
  it('exporta componente como default', () => {
    expect(typeof App).toBe('function')
  })
})
