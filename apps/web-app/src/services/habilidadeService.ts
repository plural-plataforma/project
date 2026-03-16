import { api } from '@/api/http'
import type { Habilidade, HabilidadeResponse } from '@/types/habilidade'

export const buscarHabilidades = async (): Promise<Habilidade[]> => {
  const response = await api.get<HabilidadeResponse>('/Habilidade/buscar')
  if (Array.isArray(response.data.objeto)) return response.data.objeto
  return []
}
