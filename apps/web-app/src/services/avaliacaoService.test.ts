import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/api/http'
import { buscarAvaliacaoPorId, buscarAvaliacoesCriterios, buscarAvaliacoesTodos } from './avaliacaoService'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('avaliacaoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normaliza lista de buscarTodos com objeto array', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        sucesso: true,
        mensagens: [],
        objeto: [{ id: 1, descricao: 'Obs', resumo: 'Resumo', ativo: true }],
      },
    })

    const result = await buscarAvaliacoesTodos()

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })

  it('normaliza objeto único em buscar por id', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        sucesso: true,
        mensagens: [],
        objeto: { id: 2, descricao: 'Portfólio', resumo: 'Resumo', ativo: true },
      },
    })

    const result = await buscarAvaliacaoPorId(2)

    expect(result.id).toBe(2)
    expect(result.descricao).toBe('Portfólio')
  })

  it('retorna [] em buscarAtivos quando API responde 404', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      response: {
        status: 404,
      },
    })

    const result = await buscarAvaliacoesCriterios()

    expect(result).toEqual([])
  })
})
