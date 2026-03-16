import { describe, it, expect } from 'vitest'
import EscolasPage, { escolaSchema } from './EscolasPage'

/**
 * Testes da EscolasPage.
 * Nota: Renderização não é testada devido a múltiplas instâncias de React no monorepo.
 */
describe('EscolasPage', () => {
  describe('escolaSchema', () => {
    it('valida dados mínimos (nome e estado)', () => {
      const result = escolaSchema.safeParse({
        nomeInstituicao: 'Escola Teste',
        estado: 'SP',
      })
      expect(result.success).toBe(true)
    })

    it('rejeita nome com menos de 3 caracteres', () => {
      const result = escolaSchema.safeParse({
        nomeInstituicao: 'Ab',
        estado: 'SP',
      })
      expect(result.success).toBe(false)
    })

    it('rejeita estado vazio', () => {
      const result = escolaSchema.safeParse({
        nomeInstituicao: 'Escola Teste',
        estado: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('módulo', () => {
    it('exporta componente como default', () => {
      expect(typeof EscolasPage).toBe('function')
    })
  })
})
