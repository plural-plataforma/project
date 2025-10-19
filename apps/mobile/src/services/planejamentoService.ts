import { Planejamento, PlanejamentoResponse } from '@src/types/planejamento'
import { api } from '../services/auth'

export const buscarPlanejamento = async (): Promise<Planejamento[]> => {
  try {
    const response = await api.get<PlanejamentoResponse>('/Planejamento/buscar')

    let planejamentos: Planejamento[] = []

    if (Array.isArray(response.data.objeto)) {
      planejamentos = response.data.objeto
    } else if (Array.isArray(response.data.listaObjetos)) {
      planejamentos = response.data.listaObjetos
    }
    return planejamentos
  } catch (error) {
    return []
  }
}

export const buscarPlanejamentoPorId = async (
  idPlanejamento: number
): Promise<Planejamento> => {
  try {
    const response = await api.get<PlanejamentoResponse>(
      '/Planejamento/buscar/' + idPlanejamento
    )
    if (response.data.sucesso && response.data.objeto) {
      return response.data.listaObjetos as unknown as Planejamento
    }
    throw new Error('Aluno não encontrado')
  } catch (error) {
    console.error('❌ Erro ao buscar aluno por ID:', error)
    throw error
  }
}
