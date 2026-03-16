import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buscarEstrategias } from './estrategiasService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('estrategiasService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buscarEstrategias', () => {
    it('retorna lista quando objeto é array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          objeto: [{ id: 1, titulo: 'Estratégia 1' }],
        },
      })

      const result = await buscarEstrategias()

      expect(result).toHaveLength(1)
      expect(result[0].titulo).toBe('Estratégia 1')
    })

    it('retorna array vazio quando objeto não é array', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { objeto: null },
      })

      const result = await buscarEstrategias()

      expect(result).toEqual([])
    })
  })
})
