import { describe, it, expect } from 'vitest'
import AvaliacoesPage, { statusConfig } from './AvaliacoesPage'

/**
 * Testes da AvaliacoesPage.
 * Nota: Renderização não é testada devido a múltiplas instâncias de React no monorepo.
 */
describe('AvaliacoesPage', () => {
  describe('statusConfig', () => {
    it('mapeia status conhecidos', () => {
      expect(statusConfig.Pendente).toEqual({ label: 'Pendente', variant: 'muted' })
      expect(statusConfig.EmAndamento).toEqual({ label: 'Em andamento', variant: 'default' })
      expect(statusConfig.Concluida).toEqual({ label: 'Concluída', variant: 'success' })
      expect(statusConfig.Cancelada).toEqual({ label: 'Cancelada', variant: 'danger' })
    })
  })

  describe('módulo', () => {
    it('exporta componente como default', () => {
      expect(typeof AvaliacoesPage).toBe('function')
    })
  })
})
