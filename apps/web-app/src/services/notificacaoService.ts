import { api } from '@/api/http'
import type { Notificacao, NotificacaoResponse } from '@/types/notificacao'

export const listarNotificacoes = async (params: { apenasNaoLidas?: boolean } = {}): Promise<Notificacao[]> => {
  const response = await api.get<NotificacaoResponse>('/Notificacao/listar', { params })
  if (response.data.sucesso) return response.data.listaObjetos ?? []
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao listar notificações')
}

export const marcarNotificacaoComoLida = async (id: number): Promise<void> => {
  const response = await api.post<NotificacaoResponse>(`/Notificacao/${id}/marcar-lida`)
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao marcar notificação como lida')
  }
}

export const marcarTodasNotificacoesComoLidas = async (): Promise<void> => {
  const response = await api.post<NotificacaoResponse>('/Notificacao/marcar-todas-lidas')
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao marcar notificações como lidas')
  }
}
