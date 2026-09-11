import { api } from '@/api/http'
import type { TermoPendente, TermoResponse } from '@/types/termo'

export const listarTermosPendentes = async (): Promise<TermoPendente[]> => {
  const response = await api.get<TermoResponse>('/termos/pendentes')
  if (response.data.sucesso) return response.data.listaObjetos ?? []
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao carregar termos pendentes')
}

export const aceitarTermo = async (termoVersaoId: number): Promise<void> => {
  const response = await api.post<TermoResponse>('/termos/aceitar', { termoVersaoId })
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao aceitar termo')
  }
}
