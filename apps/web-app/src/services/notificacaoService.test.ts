import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from './notificacaoService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('notificacaoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarNotificacoes', () => {
    it('retorna a lista quando a API responde com sucesso', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [
            { id: 1, tipo: 0, titulo: 'Relatório pronto', mensagem: 'msg', relatorioId: 5, lida: false, createdAt: '2026-09-02T10:00:00Z' },
          ],
        },
      })

      const result = await listarNotificacoes({ apenasNaoLidas: true })

      expect(result).toHaveLength(1)
      expect(api.get).toHaveBeenCalledWith('/Notificacao/listar', { params: { apenasNaoLidas: true } })
    })

    it('retorna array vazio quando não há notificações', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { sucesso: true, listaObjetos: [] } })

      const result = await listarNotificacoes()

      expect(result).toEqual([])
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Professor não identificado.'] },
      })

      await expect(listarNotificacoes()).rejects.toThrow('Professor não identificado.')
    })
  })

  describe('marcarNotificacaoComoLida', () => {
    it('chama o endpoint correto', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: true } })

      await marcarNotificacaoComoLida(7)

      expect(api.post).toHaveBeenCalledWith('/Notificacao/7/marcar-lida')
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: false, mensagens: ['Notificação não encontrada.'] } })

      await expect(marcarNotificacaoComoLida(7)).rejects.toThrow('Notificação não encontrada.')
    })
  })

  describe('marcarTodasNotificacoesComoLidas', () => {
    it('chama o endpoint correto', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: true } })

      await marcarTodasNotificacoesComoLidas()

      expect(api.post).toHaveBeenCalledWith('/Notificacao/marcar-todas-lidas')
    })
  })
})
