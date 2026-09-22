import { describe, it, expect, vi, beforeEach } from 'vitest'
import { obterLimiteUsoIA } from './usoIAService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('usoIAService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obterLimiteUsoIA', () => {
    it('retorna o uso quando a API responde com sucesso', async () => {
      const limite = {
        usoHoje: 4,
        limiteDiario: 20,
        limiteDiarioAtingido: false,
        usoMes: 30,
        limiteMensal: 50,
        limiteMensalAtingido: false,
      }
      vi.mocked(api.get).mockResolvedValue({ data: { sucesso: true, mensagens: [], objeto: limite } })

      await expect(obterLimiteUsoIA()).resolves.toEqual(limite)
      expect(api.get).toHaveBeenCalledWith('/UsoIA/limite')
    })

    it('lança erro com a mensagem da API quando falha', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Professor não identificado.'], objeto: null },
      })

      await expect(obterLimiteUsoIA()).rejects.toThrow('Professor não identificado.')
    })
  })
})
