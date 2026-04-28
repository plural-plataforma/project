import { Planejamento, PlanejamentoResponse, PlanejamentoVinculaEstrategia, PlanejamentoVinculaHabilidade } from '@src/types/planejamento'
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

export const cadastrarPlanejamento = async (payload: {
  apelido: string
  dataInicio: string
  dataFim: string
}): Promise<void> => {
  try {
    const response = await api.post<PlanejamentoResponse>('/Planejamento/cadastro', payload)
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao cadastrar planejamento')
    }
  } catch (error) {
    console.error('❌ Erro ao cadastrar planejamento:', error)
    throw error
  }
}

export const atualizarPlanejamento = async (payload: {
  id: number
  apelido: string
  dataInicio: string
  dataFim: string
}): Promise<void> => {
  try {
    const response = await api.patch<PlanejamentoResponse>('/Planejamento/atualizar', payload)
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar planejamento')
    }
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
    console.error('Erro ao vincular aluno:', error)
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
    console.error('Erro ao vincular habilidade:', error)
    throw error
  }
}

export const vincularEstrategia = async (payload: {
  idPlanejamento: number
  idEstrategia: number
}): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularestrategia', payload)
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular estratégia')
    }
  } catch (error) {
    console.error('Erro ao vincular estratégia:', error)
    throw error
  }
}

export const vincularAvaliacao = async (payload: {
  idPlanejamento: number
  idAvaliacao: number
}): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularavaliacao', payload)
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular avaliação')
    }
  } catch (error) {
    console.error('Erro ao vincular avaliação:', error)
    throw error
  }
}

export const vincularAlunosLote = async (idPlanejamento: number, idAlunos: number[]): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularalunoslote', { idPlanejamento, idAlunos })
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular alunos')
    }
  } catch (error) {
    console.error('Erro ao vincular alunos (lote):', error)
    throw error
  }
}

export const vincularHabilidadesLote = async (idPlanejamento: number, idHabilidades: number[]): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularhabilidadeslote', { idPlanejamento, idHabilidades })
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular habilidades')
    }
  } catch (error) {
    console.error('Erro ao vincular habilidades (lote):', error)
    throw error
  }
}

export const vincularEstrategiasLote = async (idPlanejamento: number, idEstrategias: number[]): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularestrategiaslote', { idPlanejamento, idEstrategias })
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular estratégias')
    }
  } catch (error) {
    console.error('Erro ao vincular estratégias (lote):', error)
    throw error
  }
}

export const vincularAvaliacoesLote = async (idPlanejamento: number, idAvaliacoes: number[]): Promise<void> => {
  try {
    const response = await api.post('/Planejamento/vincularavaliacoeslote', { idPlanejamento, idAvaliacoes })
    if (!response.data.sucesso) {
      throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular avaliações')
    }
  } catch (error) {
    console.error('Erro ao vincular avaliações (lote):', error)
    throw error
  }
}