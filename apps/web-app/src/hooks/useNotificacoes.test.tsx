import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNotificacoes } from './useNotificacoes'
import * as notificacaoService from '@/services/notificacaoService'
import { PageWrapper } from '@/test/page-test-utils'
import type { Notificacao } from '@/types/notificacao'

vi.mock('@/services/notificacaoService')

const NOTIFICACAO_LIDA: Notificacao = {
  id: 1,
  tipo: 0,
  titulo: 'Relatório pronto',
  mensagem: 'msg',
  relatorioId: 5,
  lida: true,
  createdAt: '2026-09-02T09:00:00Z',
}

const NOTIFICACAO_NAO_LIDA: Notificacao = {
  id: 2,
  tipo: 0,
  titulo: 'Relatório pronto',
  mensagem: 'msg',
  relatorioId: 6,
  lida: false,
  createdAt: '2026-09-02T10:00:00Z',
}

describe('useNotificacoes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calcula totalNaoLidas a partir da lista', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_LIDA, NOTIFICACAO_NAO_LIDA])

    const { result } = renderHook(() => useNotificacoes(), { wrapper: PageWrapper })

    await waitFor(() => expect(result.current.notificacoes).toHaveLength(2))
    expect(result.current.totalNaoLidas).toBe(1)
    expect(result.current.naoLidas).toEqual([NOTIFICACAO_NAO_LIDA])
  })

  it('marcarComoLida chama o service com o id certo', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_NAO_LIDA])
    vi.mocked(notificacaoService.marcarNotificacaoComoLida).mockResolvedValue(undefined)

    const { result } = renderHook(() => useNotificacoes(), { wrapper: PageWrapper })
    await waitFor(() => expect(result.current.notificacoes).toHaveLength(1))

    result.current.marcarComoLida(2)

    await waitFor(() => expect(notificacaoService.marcarNotificacaoComoLida).toHaveBeenCalledWith(2))
  })
})
