import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listarTermosPendentes, aceitarTermo } from './termoService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('termoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarTermosPendentes', () => {
    it('retorna a lista quando a API responde com sucesso', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [
            { termoVersaoId: 1, chave: 'uso_ferramenta', nome: 'Termos de Uso da Ferramenta', versao: 1, texto: '<p>...</p>' },
          ],
        },
      })

      const result = await listarTermosPendentes()

      expect(result).toHaveLength(1)
      expect(api.get).toHaveBeenCalledWith('/termos/pendentes')
    })

    it('retorna array vazio quando não há pendências', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { sucesso: true, listaObjetos: [] } })

      const result = await listarTermosPendentes()

      expect(result).toEqual([])
    })
  })

  describe('aceitarTermo', () => {
    it('chama o endpoint correto', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: true } })

      await aceitarTermo(1)

      expect(api.post).toHaveBeenCalledWith('/termos/aceitar', { termoVersaoId: 1 })
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: false, mensagens: ['Versão de termo não encontrada.'] } })

      await expect(aceitarTermo(1)).rejects.toThrow('Versão de termo não encontrada.')
    })
  })
})
