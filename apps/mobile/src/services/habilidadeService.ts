import { api } from '../services/auth'
import { Habilidade, HabilidadeResponse } from '@src/types/habilidade'

export const buscarHabilidades = async (): Promise<Habilidade[]> => {
  try {
    const response = await api.get<HabilidadeResponse>('/Habilidade/buscar')

    let habilidades: Habilidade[] = []

    habilidades = response.data.objeto

    return habilidades
  } catch (error) {
    return []
  }
}
