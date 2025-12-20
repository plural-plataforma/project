import { Avaliacao, AvaliacaoResponse } from '@src/types/avaliacao'
import { api } from '../services/auth'

export const buscarAvaliacoes = async (): Promise<Avaliacao[]> => {
  try {
    const response = await api.get<AvaliacaoResponse>('/Avaliacao/buscarAtivos')

    let Avaliacao: Avaliacao[] = []

    Avaliacao = response.data.objeto

    return Avaliacao
  } catch (error) {
    return []
  }
}


