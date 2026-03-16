import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buscarHabilidades } from './habilidadeService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
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
})
