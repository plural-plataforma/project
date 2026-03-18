import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buscarEscolas, buscarEscolaPorId, salvarEscola } from './escolasService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('escolasService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarEscolas', () => {
    it('retorna listaObjetos quando presente', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [{ id: 1, nomeInstituicao: 'Escola A' }],
        },
      })

      const result = await buscarEscolas()

      expect(result).toHaveLength(1)
      expect(result[0].nomeInstituicao).toBe('Escola A')
    })

    it('retorna objeto quando é array e listaObjetos vazia', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: [{ id: 2, nomeInstituicao: 'Escola B' }],
        },
      })

      const result = await buscarEscolas()

      expect(result).toHaveLength(1)
      expect(result[0].nomeInstituicao).toBe('Escola B')
    })

    it('retorna array vazio quando sucesso é false', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false },
      })

      const result = await buscarEscolas()

      expect(result).toEqual([])
    })
  })

  describe('buscarEscolaPorId', () => {
    it('retorna escola quando encontrada', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: { id: 1, nomeInstituicao: 'Escola X' },
        },
      })

      const result = await buscarEscolaPorId(1)

      expect(result.id).toBe(1)
      expect(result.nomeInstituicao).toBe('Escola X')
    })

    it('lança erro quando não encontrada', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false },
      })

      await expect(buscarEscolaPorId(999)).rejects.toThrow('Escola não encontrada')
    })
  })

  describe('salvarEscola', () => {
    it('usa PATCH quando data.id existe (edição)', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: { id: 1, nomeInstituicao: 'Escola Editada' },
        },
      })

      const result = await salvarEscola({ id: 1, nomeInstituicao: 'Escola Editada' })

      expect(api.patch).toHaveBeenCalledWith('/Escola/atualizar', expect.any(Object))
      expect(result.nomeInstituicao).toBe('Escola Editada')
    })

    it('usa POST quando data.id não existe (criação)', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true, objeto: null },
      })
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [{ id: 10, nomeInstituicao: 'Nova Escola' }],
        },
      })

      const result = await salvarEscola({ nomeInstituicao: 'Nova Escola' })

      expect(api.post).toHaveBeenCalledWith('/Escola/cadastro', expect.any(Object))
      expect(result.nomeInstituicao).toBe('Nova Escola')
      expect(result.id).toBe(10)
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Nome já existe'] },
      })

      await expect(salvarEscola({ nomeInstituicao: 'X' })).rejects.toThrow('Nome já existe')
    })
  })
})
