import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from '@/services/notificacaoService'

const POLL_INTERVAL_MS = 20_000

export function useNotificacoes() {
  const qc = useQueryClient()

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => listarNotificacoes(),
    refetchInterval: POLL_INTERVAL_MS,
  })

  const naoLidas = notificacoes.filter((n) => !n.lida)

  const marcarComoLidaMutation = useMutation({
    mutationFn: (id: number) => marcarNotificacaoComoLida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  })

  const marcarTodasComoLidasMutation = useMutation({
    mutationFn: () => marcarTodasNotificacoesComoLidas(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  })

  return {
    notificacoes,
    naoLidas,
    totalNaoLidas: naoLidas.length,
    marcarComoLida: marcarComoLidaMutation.mutate,
    marcarTodasComoLidas: marcarTodasComoLidasMutation.mutate,
  }
}
