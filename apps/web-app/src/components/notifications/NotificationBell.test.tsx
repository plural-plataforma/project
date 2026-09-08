import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderPage } from '@/test/page-test-utils'
import { NotificationBell } from './NotificationBell'
import * as notificacaoService from '@/services/notificacaoService'
import type { Notificacao } from '@/types/notificacao'

vi.mock('@/services/notificacaoService')

const NOTIFICACAO_NAO_LIDA: Notificacao = {
  id: 1,
  tipo: 0,
  titulo: 'Relatório pronto',
  mensagem: 'O relatório de Beatriz foi gerado.',
  relatorioId: 5,
  lida: false,
  createdAt: '2026-09-02T10:00:00Z',
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não mostra contagem quando não há notificações', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([])

    renderPage(<NotificationBell />)

    await waitFor(() => expect(notificacaoService.listarNotificacoes).toHaveBeenCalled())
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
  })

  it('mostra a contagem de notificações não lidas', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_NAO_LIDA])

    renderPage(<NotificationBell />)

    expect(await screen.findByTestId('notification-badge')).toHaveTextContent('1')
  })

  it('ao clicar numa notificação, marca como lida', async () => {
    const user = userEvent.setup()
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_NAO_LIDA])
    vi.mocked(notificacaoService.marcarNotificacaoComoLida).mockResolvedValue(undefined)

    renderPage(<NotificationBell />)

    await screen.findByTestId('notification-badge')
    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    await user.click(await screen.findByText('Relatório pronto'))

    expect(notificacaoService.marcarNotificacaoComoLida).toHaveBeenCalledWith(1)
  })
})
