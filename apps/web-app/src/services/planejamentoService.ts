import { type AxiosError } from 'axios'
import { api } from '@/api/http'
import type { Planejamento, PlanejamentoResponse } from '@/types/planejamento'

type ExcluirPlanejamentoResponse = { sucesso: boolean; mensagens?: string[] }

export const buscarPlanejamento = async (): Promise<Planejamento[]> => {
  const response = await api.get<PlanejamentoResponse>('/Planejamento/buscar')
  if (Array.isArray(response.data.objeto)) return response.data.objeto
  if (Array.isArray(response.data.listaObjetos)) return response.data.listaObjetos
  return []
}

export const buscarPlanejamentoPorId = async (id: number): Promise<Planejamento> => {
  const response = await api.get<PlanejamentoResponse>(`/Planejamento/buscar/${id}`)
  if (response.data.sucesso && response.data.objeto) {
    return response.data.objeto as Planejamento
  }
  throw new Error(response.data.mensagens?.join(', ') || 'Planejamento não encontrado')
}

// Retorna o Planejamento recém-criado (com ID real) via re-fetch por apelido+dataInicio
export const cadastrarPlanejamento = async (payload: {
  apelido: string
  dataInicio: string
  dataFim: string
  descicaoPlanejamento?: string
}): Promise<Planejamento> => {
  const response = await api.post<PlanejamentoResponse>('/Planejamento/cadastro', payload)
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao cadastrar planejamento')
  }
  // API não retorna o objeto — re-busca para obter o ID real (mesmo padrão da escola)
  const lista = await buscarPlanejamento()
  const novo = lista.find(
    (p) => p.apelido === payload.apelido && p.dataInicio === payload.dataInicio
  )
  if (!novo) throw new Error('PDI criado, mas não encontrado na lista. Recarregue a página.')
  return novo
}

export const atualizarPlanejamento = async (payload: {
  id: number
  apelido: string
  dataInicio: string
  dataFim: string
  descicaoPlanejamento?: string
}): Promise<void> => {
  const response = await api.patch<PlanejamentoResponse>('/Planejamento/atualizar', payload)
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar planejamento')
  }
}

export const excluirPlanejamento = async (id: number): Promise<void> => {
  try {
    const response = await api.delete<ExcluirPlanejamentoResponse>(`/Planejamento/${id}`)
    if (response.data.sucesso) return
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao excluir planejamento')
  } catch (error) {
    const axiosError = error as AxiosError<ExcluirPlanejamentoResponse>
    const msg = axiosError.response?.data?.mensagens?.join(', ')
    if (msg) throw new Error(msg)
    if (error instanceof Error) throw error
    throw new Error('Falha ao excluir planejamento')
  }
}

export const vincularAlunoPlano = async (idPlanejamento: number, idAluno: number) => {
  const response = await api.post('/Planejamento/vincularaluno', { idPlanejamento, idAluno })
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular aluno')
  }
}

export const vincularHabilidadePlano = async (idPlanejamento: number, idHabilidade: number) => {
  const response = await api.post('/Planejamento/vincularhabilidade', { idPlanejamento, idHabilidade })
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular habilidade')
  }
}

export const vincularEstrategiaPlano = async (idPlanejamento: number, idEstrategia: number) => {
  const response = await api.post('/Planejamento/vincularestrategia', { idPlanejamento, idEstrategia })
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular estratégia')
  }
}

export const vincularAvaliacaoPlano = async (idPlanejamento: number, idAvaliacao: number) => {
  // Bug corrigido: '/' inicial ausente causava 404
  const response = await api.post('/Planejamento/vincularavaliacao', { idPlanejamento, idAvaliacao })
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao vincular avaliação')
  }
}
