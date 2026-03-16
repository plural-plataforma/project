import { api } from '@/api/http'
import type { BlocoComAtividade } from '@/types/bloco'

export const buscarBlocosComAtividades = async (): Promise<BlocoComAtividade[]> => {
  const response = await api.get<BlocoComAtividade[]>('/Blocos/com-atividades')
  return response.data ?? []
}
