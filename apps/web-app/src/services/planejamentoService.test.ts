import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buscarPlanejamento,
  buscarPlanejamentoPorId,
  cadastrarPlanejamento,
  atualizarPlanejamento,
  excluirPlanejamento,
  vincularAlunoPlano,
  vincularHabilidadePlano,
  vincularEstrategiaPlano,
  vincularAvaliacaoPlano,
  vincularAlunosPlanoLote,
} from './planejamentoService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('planejamentoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarPlanejamento', () => {
    it('retorna objeto quando é array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          objeto: [{ id: 1, apelido: 'PDI 1', dataInicio: '2025-01-01', dataFim: '2025-01-31' }],
        },
      })

      const result = await buscarPlanejamento()

      expect(result).toHaveLength(1)
      expect(result[0].apelido).toBe('PDI 1')
    })

    it('retorna listaObjetos quando objeto não é array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          listaObjetos: [{ id: 2, apelido: 'PDI 2', dataInicio: '2025-02-01', dataFim: '2025-02-28' }],
        },
      })

      const result = await buscarPlanejamento()

      expect(result).toHaveLength(1)
      expect(result[0].apelido).toBe('PDI 2')
    })

    it('retorna array vazio quando nenhum formato válido', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { objeto: null, listaObjetos: null },
      })

      const result = await buscarPlanejamento()

      expect(result).toEqual([])
    })
  })

  describe('buscarPlanejamentoPorId', () => {
    it('retorna planejamento quando encontrado', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: { id: 1, apelido: 'PDI X', dataInicio: '2025-01-01', dataFim: '2025-01-31' },
        },
      })

      const result = await buscarPlanejamentoPorId(1)

      expect(result.id).toBe(1)
      expect(result.apelido).toBe('PDI X')
    })

    it('lança erro quando não encontrado', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Não encontrado'] },
      })

      await expect(buscarPlanejamentoPorId(999)).rejects.toThrow('Não encontrado')
    })
  })

  describe('cadastrarPlanejamento', () => {
    it('re-busca lista e retorna novo PDI quando API não retorna objeto', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true },
      })
      vi.mocked(api.get).mockResolvedValue({
        data: {
          listaObjetos: [
            {
              id: 10,
              apelido: 'Novo PDI',
              dataInicio: '2025-03-01',
              dataFim: '2025-03-31',
            },
          ],
        },
      })

      const result = await cadastrarPlanejamento({
        apelido: 'Novo PDI',
        dataInicio: '2025-03-01',
        dataFim: '2025-03-31',
      })

      expect(result.id).toBe(10)
      expect(result.apelido).toBe('Novo PDI')
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Apelido duplicado'] },
      })

      await expect(
        cadastrarPlanejamento({
          apelido: 'X',
          dataInicio: '2025-01-01',
          dataFim: '2025-01-31',
        })
      ).rejects.toThrow('Apelido duplicado')
    })

    it('lança erro quando PDI não encontrado na lista após re-busca', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true },
      })
      vi.mocked(api.get).mockResolvedValue({
        data: { listaObjetos: [] },
      })

      await expect(
        cadastrarPlanejamento({
          apelido: 'Novo',
          dataInicio: '2025-01-01',
          dataFim: '2025-01-31',
        })
      ).rejects.toThrow('PDI criado, mas não encontrado na lista')
    })
  })

  describe('atualizarPlanejamento', () => {
    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Data inválida'] },
      })

      await expect(
        atualizarPlanejamento({
          id: 1,
          apelido: 'X',
          dataInicio: '2025-01-01',
          dataFim: '2025-01-31',
        })
      ).rejects.toThrow('Data inválida')
    })
  })

  describe('excluirPlanejamento', () => {
    it('resolve quando API retorna sucesso', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { sucesso: true, mensagens: ['Planejamento excluído com sucesso.'] },
      })

      await expect(excluirPlanejamento(1)).resolves.toBeUndefined()
      expect(api.delete).toHaveBeenCalledWith('/Planejamento/1')
    })

    it('lança erro quando API retorna falha no corpo', async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Planejamento não encontrado.'] },
      })

      await expect(excluirPlanejamento(99)).rejects.toThrow('Planejamento não encontrado.')
    })
  })

  describe('vincularAlunoPlano', () => {
    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Aluno já vinculado'] },
      })

      await expect(vincularAlunoPlano(1, 2)).rejects.toThrow('Aluno já vinculado')
    })
  })

  describe('vincularHabilidadePlano', () => {
    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Habilidade inválida'] },
      })

      await expect(vincularHabilidadePlano(1, 1)).rejects.toThrow('Habilidade inválida')
    })
  })

  describe('vincularEstrategiaPlano', () => {
    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Estratégia inválida'] },
      })

      await expect(vincularEstrategiaPlano(1, 1)).rejects.toThrow('Estratégia inválida')
    })
  })

  describe('vincularAvaliacaoPlano', () => {
    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Avaliação inválida'] },
      })

      await expect(vincularAvaliacaoPlano(1, 1)).rejects.toThrow('Avaliação inválida')
    })
  })

  describe('vincularAlunosPlanoLote', () => {
    it('resolve quando API retorna sucesso', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: true } })

      await expect(vincularAlunosPlanoLote(5, [1, 2])).resolves.toBeUndefined()
      expect(api.post).toHaveBeenCalledWith('/Planejamento/vincularalunoslote', {
        idPlanejamento: 5,
        idAlunos: [1, 2],
      })
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Planejamento não encontrado.'] },
      })

      await expect(vincularAlunosPlanoLote(1, [9])).rejects.toThrow('Planejamento não encontrado.')
    })
  })
})
