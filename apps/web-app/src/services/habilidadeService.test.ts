import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buscarHabilidades, criarHabilidade, atualizarHabilidade, excluirHabilidade } from './habilidadeService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('habilidadeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarHabilidades', () => {
    it('retorna lista quando objeto é array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          objeto: [{ id: 1, titulo: 'Habilidade 1' }],
        },
      })

      const result = await buscarHabilidades()

      expect(result).toHaveLength(1)
      expect(result[0].titulo).toBe('Habilidade 1')
    })

    it('retorna array vazio quando objeto não é array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { objeto: null },
      })

      const result = await buscarHabilidades()

      expect(result).toEqual([])
    })
  })

  describe('criarHabilidade', () => {
    it('envia payload e devolve a habilidade criada', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true, mensagens: [], objeto: { id: 9, descricao: 'Nova', ehPropria: true } },
      })

      const result = await criarHabilidade({ idNivelEnsino: 2, tipo: 'Habilidade', descricao: 'Nova' })

      expect(api.post).toHaveBeenCalledWith('/Habilidade/cadastro', {
        idNivelEnsino: 2,
        tipo: 'Habilidade',
        descricao: 'Nova',
      })
      expect(result.id).toBe(9)
      expect(result.ehPropria).toBe(true)
    })

    it('lança erro com as mensagens quando sucesso é falso', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Tipo e descrição são obrigatórios.'], objeto: null },
      })

      await expect(
        criarHabilidade({ idNivelEnsino: 2, tipo: ' ', descricao: ' ' }),
      ).rejects.toThrow('Tipo e descrição são obrigatórios.')
    })
  })

  describe('excluirHabilidade', () => {
    it('envia DELETE para a habilidade', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: { sucesso: true, mensagens: [] } })

      await excluirHabilidade(7)

      expect(api.delete).toHaveBeenCalledWith('/Habilidade/excluir/7')
    })

    it('lança erro com a mensagem quando sucesso é falso', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Habilidade não encontrada.'] },
      })

      await expect(excluirHabilidade(7)).rejects.toThrow('Habilidade não encontrada.')
    })
  })

  describe('atualizarHabilidade', () => {
    it('envia PATCH com o payload', async () => {
      vi.mocked(api.patch).mockResolvedValue({ data: { sucesso: true, mensagens: [] } })

      await atualizarHabilidade({ id: 3, ativo: false })

      expect(api.patch).toHaveBeenCalledWith('/Habilidade/atualizar', { id: 3, ativo: false })
    })

    it('lança erro quando sucesso é falso', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Habilidade não encontrada.'] },
      })

      await expect(atualizarHabilidade({ id: 3, ativo: false })).rejects.toThrow('Habilidade não encontrada.')
    })
  })
})
