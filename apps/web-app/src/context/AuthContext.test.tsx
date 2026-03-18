import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth, authLogin, getErrorMessage } from './AuthContext'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    post: vi.fn(),
  },
}))

describe('AuthContext', () => {
  const storage: Record<string, string> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(storage).forEach((k) => delete storage[k])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => storage[key] ?? null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => {
      storage[key] = val
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete storage[key]
    })
  })

  describe('authLogin', () => {
    it('retorna token e salva no localStorage', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          token: { token: 'jwt-xyz', precisaTrocarSenha: false },
        },
      })

      const result = await authLogin({ email: 'a@b.com', senha: '123' })

      expect(result.token).toBe('jwt-xyz')
      expect(result.precisaTrocarSenha).toBe(false)
      expect(storage['authToken']).toBe('jwt-xyz')
    })

    it('lança erro quando API não retorna token', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { token: null },
      })

      await expect(authLogin({ email: 'a@b.com', senha: '123' })).rejects.toThrow(
        'Token não retornado pela API'
      )
    })
  })

  describe('getErrorMessage', () => {
    it('retorna message do response quando disponível', () => {
      const err = {
        response: { data: { message: 'Email já cadastrado' } },
        message: 'Request failed',
      }
      expect(getErrorMessage(err)).toBe('Email já cadastrado')
    })

    it('retorna error.message quando sem response.data.message', () => {
      const err = { message: 'Network Error' }
      expect(getErrorMessage(err)).toBe('Network Error')
    })

    it('retorna fallback quando erro desconhecido', () => {
      expect(getErrorMessage({})).toBe('Erro desconhecido')
    })
  })
})
