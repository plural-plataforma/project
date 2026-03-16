import { describe, it, expect } from 'vitest'
import RegisterPage, { registerSchema } from './RegisterPage'

/**
 * Testes da RegisterPage.
 * Nota: Renderização não é testada devido a múltiplas instâncias de React no monorepo.
 * Cobrimos: schema de validação e export do módulo.
 */
describe('RegisterPage', () => {
  describe('registerSchema', () => {
    it('valida dados corretos', () => {
      const result = registerSchema.safeParse({
        nomeCompleto: 'João Silva',
        email: 'joao@email.com',
        senha: 'senha1234',
        confirmarSenha: 'senha1234',
        aceitouTermos: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejeita nome com menos de 3 caracteres', () => {
      const result = registerSchema.safeParse({
        nomeCompleto: 'Jo',
        email: 'joao@email.com',
        senha: 'senha1234',
        confirmarSenha: 'senha1234',
        aceitouTermos: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Nome'))).toBe(true)
      }
    })

    it('rejeita senhas que não coincidem', () => {
      const result = registerSchema.safeParse({
        nomeCompleto: 'João Silva',
        email: 'joao@email.com',
        senha: 'senha1234',
        confirmarSenha: 'outra1234',
        aceitouTermos: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('coincidem'))).toBe(true)
      }
    })

    it('rejeita quando termos não aceitos', () => {
      const result = registerSchema.safeParse({
        nomeCompleto: 'João Silva',
        email: 'joao@email.com',
        senha: 'senha1234',
        confirmarSenha: 'senha1234',
        aceitouTermos: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('termos'))).toBe(true)
      }
    })
  })

  describe('módulo', () => {
    it('exporta componente como default', () => {
      expect(typeof RegisterPage).toBe('function')
    })
  })
})
