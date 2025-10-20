import { Planejamento, PlanejamentoResponse } from '@src/types/planejamento'
import { Habilidade } from '@src/types/habilidade'
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
    if (response.data.sucesso && response.data.objeto && typeof response.data.objeto === 'object') {
      return response.data.objeto as Planejamento
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Planejamento não encontrado')
  } catch (error) {
    console.error('❌ Erro ao buscar planejamento por ID:', error)
    throw error
  }
}

export const atualizarPlanejamento = async (payload: {
  id: number
  apelido: string
  dataInicio: string
  dataFim: string
}): Promise<Planejamento> => {
  try {
    const response = await api.patch<PlanejamentoResponse>('/Planejamento/atualizar', payload)
    if (response.data.sucesso && response.data.objeto && typeof response.data.objeto === 'object') {
      return response.data.objeto as Planejamento
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar planejamento')
  } catch (error) {
    console.error('❌ Erro ao atualizar planejamento:', error)
    throw error
  }
}

export const vincularAluno = async (payload: {
  idPlanejamento: number
  idAluno: number
}): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularaluno', payload)
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular aluno')
    }
  } catch (error) {
    console.error('❌ Erro ao vincular aluno:', error)
    throw error
  }
}

export const vincularHabilidade = async (payload: {
  idPlanejamento: number
  idHabilidade: number
}): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularhabilidade', payload)
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular habilidade')
    }
  } catch (error) {
    console.error('❌ Erro ao vincular habilidade:', error)
    throw error
  }
}