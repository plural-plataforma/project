import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { authLogin, getErrorMessage } from './AuthContext'
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
    it('retorna mensagem amigável a partir de AxiosError com message no JSON', () => {
      const config = { method: 'post', url: '/register' } as InternalAxiosRequestConfig
      const err = new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        data: { message: 'Email já cadastrado' },
        config,
      })

      expect(getErrorMessage(err)).toContain('Email já cadastrado')
    })

    it('retorna texto amigável quando não há resposta (rede)', () => {
      const config = { method: 'post', url: '/login' } as InternalAxiosRequestConfig
      const err = new AxiosError('Network Error', 'ERR_NETWORK', config)
      err.response = undefined

      const msg = getErrorMessage(err)
      expect(msg).toMatch(/conexão|servidor|internet/i)
      expect(msg).toContain('Informe ao suporte:')
    })

    it('retorna fallback genérico quando erro não é AxiosError nem Error', () => {
      expect(getErrorMessage({})).toMatch(/inesperado|suporte/i)
    })
  })
})
