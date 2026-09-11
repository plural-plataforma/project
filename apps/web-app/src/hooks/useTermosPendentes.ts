import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarTermosPendentes, aceitarTermo } from '@/services/termoService'

export function useTermosPendentes(enabled: boolean) {
  const qc = useQueryClient()

  const { data: pendentes = [], isLoading, isError } = useQuery({
    queryKey: ['termos-pendentes'],
    queryFn: () => listarTermosPendentes(),
    enabled,
    retry: false,
  })

  const aceitarMutation = useMutation({
    mutationFn: (termoVersaoId: number) => aceitarTermo(termoVersaoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['termos-pendentes'] }),
  })

  return {
    pendentes,
    isLoading,
    isError,
    aceitar: aceitarMutation.mutateAsync,
    aceitando: aceitarMutation.isPending,
  }
}
