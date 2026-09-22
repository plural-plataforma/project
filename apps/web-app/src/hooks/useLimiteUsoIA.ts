import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { obterLimiteUsoIA } from '@/services/usoIAService'

export const LIMITE_USO_IA_QUERY_KEY = ['limite-uso-ia'] as const

export function useLimiteUsoIA() {
  const { data: limite } = useQuery({
    queryKey: LIMITE_USO_IA_QUERY_KEY,
    queryFn: obterLimiteUsoIA,
    // Consulta informativa: se falhar, a API continua sendo quem bloqueia a geração.
    retry: false,
  })

  return {
    limite,
    limiteDiarioAtingido: limite?.limiteDiarioAtingido ?? false,
  }
}

/** Atualiza o contador após uma geração (sucesso ou bloqueio pela API). */
export function useAtualizarLimiteUsoIA() {
  const qc = useQueryClient()
  return useCallback(() => qc.invalidateQueries({ queryKey: LIMITE_USO_IA_QUERY_KEY }), [qc])
}
