import { api } from '../services/auth'
import { Estrategia, EstrategiaResponse } from '@src/types/estrategia'

export const buscarEstrategia = async (): Promise<Estrategia[]> => {
  try {
    const response = await api.get<EstrategiaResponse>('/Estrategia/buscarAtivos')

    let Estrategia: Estrategia[] = []

    Estrategia = response.data.objeto

    return Estrategia
  } catch (error) {
    return []
  }
}
