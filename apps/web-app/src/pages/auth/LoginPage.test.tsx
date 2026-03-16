import { describe, it, expect } from 'vitest'
import LoginPage, { loginSchema } from './LoginPage'

/**
 * Testes da LoginPage.
 * Nota: Renderização completa não é testada devido a múltiplas instâncias de React
 * no monorepo (Invalid hook call). Cobrimos: schema de validação e export do módulo.
 */
describe('LoginPage', () => {
  describe('loginSchema', () => {
    it('valida email e senha corretos', () => {
      const result = loginSchema.safeParse({
        email: 'teste@email.com',
        senha: 'senha1234',
      })
      expect(result.success).toBe(true)
    })

    it('rejeita email inválido', () => {
      const result = loginSchema.safeParse({
        email: 'invalido',
        senha: 'senha1234',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('E-mail inválido')
      }
    })

    it('rejeita senha com menos de 8 caracteres', () => {
      const result = loginSchema.safeParse({
        email: 'teste@email.com',
        senha: '123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Senha deve ter pelo menos 8 caracteres')
      }
    })

    it('rejeita campos vazios', () => {
      const result = loginSchema.safeParse({ email: '', senha: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('módulo', () => {
    it('exporta componente como default', () => {
      expect(typeof LoginPage).toBe('function')
    })
  })
})
