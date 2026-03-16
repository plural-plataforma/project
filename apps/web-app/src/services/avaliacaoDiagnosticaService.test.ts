import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buscarAvaliacoesDiagnosticas } from './avaliacaoDiagnosticaService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('avaliacaoDiagnosticaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarAvaliacoesDiagnosticas', () => {
    it('mapeia totalAlunos e totalBlocos da API para quantidadeAlunos e quantidadeBlocos', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: [
            {
              id: 1,
              titulo: 'Aval 1',
              dataAplicacao: '2025-01-15',
              concluida: true,
              totalAlunos: 5,
              totalBlocos: 3,
            },
          ],
          mensagens: [],
        },
      })

      const result = await buscarAvaliacoesDiagnosticas()

      expect(result).toHaveLength(1)
      expect(result[0].quantidadeAlunos).toBe(5)
      expect(result[0].quantidadeBlocos).toBe(3)
      expect(result[0].status).toBe('Concluida')
    })

    it('deriva status EmAndamento quando concluida é false', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: [
            {
              id: 2,
              titulo: 'Aval 2',
              concluida: false,
              totalAlunos: 2,
              totalBlocos: 1,
            },
          ],
          mensagens: [],
        },
      })

      const result = await buscarAvaliacoesDiagnosticas()

      expect(result[0].status).toBe('EmAndamento')
    })

    it('preserva quantidadeAlunos/quantidadeBlocos se já existirem na resposta', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          objeto: [
            {
              id: 3,
              quantidadeAlunos: 10,
              quantidadeBlocos: 4,
              totalAlunos: 5,
            },
          ],
          mensagens: [],
        },
      })

      const result = await buscarAvaliacoesDiagnosticas()

      expect(result[0].quantidadeAlunos).toBe(10)
      expect(result[0].quantidadeBlocos).toBe(4)
    })
  })
})
