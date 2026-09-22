import { api } from '@/api/http'
import type { LimiteUsoIA, LimiteUsoIAResponse } from '@/types/usoIA'

export const obterLimiteUsoIA = async (): Promise<LimiteUsoIA> => {
  const response = await api.get<LimiteUsoIAResponse>('/UsoIA/limite')
  if (response.data.sucesso && response.data.objeto) return response.data.objeto
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao consultar uso de IA')
}
