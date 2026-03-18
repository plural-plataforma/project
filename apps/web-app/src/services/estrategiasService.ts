import { api } from '@/api/http'
import type { Estrategia, EstrategiaResponse } from '@/types/estrategia'

export const buscarEstrategias = async (): Promise<Estrategia[]> => {
  const response = await api.get<EstrategiaResponse>('/Estrategia/buscarAtivos')
  if (Array.isArray(response.data.objeto)) return response.data.objeto
  return []
}
