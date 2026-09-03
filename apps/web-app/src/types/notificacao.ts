/** Alinhado ao enum `TipoNotificacao` da API. */
export type NotificacaoTipoCodigo = 0 | 1

export interface Notificacao {
  id: number
  tipo: NotificacaoTipoCodigo
  titulo: string
  mensagem: string
  relatorioId: number | null
  lida: boolean
  createdAt: string
}

export interface NotificacaoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Notificacao | null
  listaObjetos: Notificacao[]
}
