import { describe, it, expect } from 'vitest'
import ChangePasswordPage, { changePasswordSchema } from './ChangePasswordPage'

/**
 * Testes da ChangePasswordPage.
 * Nota: Renderização não é testada devido a múltiplas instâncias de React no monorepo.
 * Cobrimos: schema de validação e export do módulo.
 */
describe('ChangePasswordPage', () => {
  describe('changePasswordSchema', () => {
    it('valida dados corretos', () => {
      const result = changePasswordSchema.safeParse({
        senhaAtual: 'senhaantiga',
        novaSenha: 'novasenha123',
        confirmarNovaSenha: 'novasenha123',
      })
      expect(result.success).toBe(true)
    })

    it('rejeita senhas que não coincidem', () => {
      const result = changePasswordSchema.safeParse({
        senhaAtual: 'senhaantiga',
        novaSenha: 'novasenha123',
        confirmarNovaSenha: 'outra123456',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('coincidem'))).toBe(true)
      }
    })

    it('rejeita quando nova senha igual à atual', () => {
      const result = changePasswordSchema.safeParse({
        senhaAtual: 'mesmasenha',
        novaSenha: 'mesmasenha',
        confirmarNovaSenha: 'mesmasenha',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('diferente'))).toBe(true)
      }
    })

    it('rejeita nova senha com menos de 8 caracteres', () => {
      const result = changePasswordSchema.safeParse({
        senhaAtual: 'senhaantiga',
        novaSenha: '123',
        confirmarNovaSenha: '123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('8 caracteres'))).toBe(true)
      }
    })
  })

  describe('módulo', () => {
    it('exporta componente como default', () => {
      expect(typeof ChangePasswordPage).toBe('function')
    })
  })
})
