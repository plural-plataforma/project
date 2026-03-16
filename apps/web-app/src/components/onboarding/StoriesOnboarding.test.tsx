import { describe, it, expect } from 'vitest'
import { StoriesOnboarding } from './StoriesOnboarding'

/**
 * Testes do StoriesOnboarding.
 * Nota: Renderização completa não é testada devido a múltiplas instâncias de React
 * no monorepo (Invalid hook call). Cobrimos: export e estrutura do módulo.
 */
describe('StoriesOnboarding', () => {
  it('exporta componente StoriesOnboarding', () => {
    expect(typeof StoriesOnboarding).toBe('function')
  })
})
