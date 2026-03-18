import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buscarBlocosComAtividades } from './blocosService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('blocosService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarBlocosComAtividades', () => {
    it('retorna lista de blocos com atividades', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [
          {
            id: 1,
            titulo: 'Bloco 1',
            atividades: [{ id: 1, titulo: 'Atividade 1' }],
          },
        ],
      })

      const result = await buscarBlocosComAtividades()

      expect(result).toHaveLength(1)
      expect(result[0].titulo).toBe('Bloco 1')
      expect(result[0].atividades).toHaveLength(1)
    })

    it('retorna array vazio quando data é null/undefined', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: null })

      const result = await buscarBlocosComAtividades()

      expect(result).toEqual([])
    })
  })
})
