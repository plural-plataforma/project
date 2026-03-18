import { api } from '@/api/http'
import type { Avaliacao, AvaliacaoPayload, AvaliacaoResponse } from '@/types/avaliacao'

const AVALIACAO_BASE_PATH = '/Avaliacao'

const isNotFoundError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  (error as { response?: { status?: number } }).response?.status === 404

const toList = (data: AvaliacaoResponse): Avaliacao[] => {
  if (!data.sucesso) {
    throw new Error(data.mensagens?.join(', ') || 'Falha ao consultar avaliações')
  }
  if (Array.isArray(data.objeto)) return data.objeto
  if (Array.isArray(data.listaObjetos)) return data.listaObjetos
  if (data.objeto && !Array.isArray(data.objeto)) return [data.objeto]
  return []
}

const toObject = (data: AvaliacaoResponse): Avaliacao => {
  if (!data.sucesso) {
    throw new Error(data.mensagens?.join(', ') || 'Falha ao consultar avaliação')
  }
  if (data.objeto && !Array.isArray(data.objeto)) return data.objeto
  throw new Error('Resposta inválida da API para avaliação')
}

export const buscarAvaliacoesTodos = async (): Promise<Avaliacao[]> => {
  const response = await api.get<AvaliacaoResponse>(`${AVALIACAO_BASE_PATH}/buscarTodos`)
  return toList(response.data)
}

export const buscarAvaliacoesCriterios = async (): Promise<Avaliacao[]> => {
  try {
    const response = await api.get<AvaliacaoResponse>(`${AVALIACAO_BASE_PATH}/buscarAtivos`)
    return toList(response.data)
  } catch (error) {
    if (isNotFoundError(error)) {
      return []
    }
    throw error
  }
}

export const buscarAvaliacaoPorId = async (id: number): Promise<Avaliacao> => {
  const response = await api.get<AvaliacaoResponse>(`${AVALIACAO_BASE_PATH}/buscar/${id}`)
  return toObject(response.data)
}

export const criarAvaliacao = async (payload: AvaliacaoPayload): Promise<Avaliacao> => {
  const response = await api.post<AvaliacaoResponse>(`${AVALIACAO_BASE_PATH}/cadastro`, payload)
  const data = response.data
  if (!data.sucesso) {
    throw new Error(data.mensagens?.join(', ') || 'Falha ao criar avaliação')
  }
  if (data.objeto && !Array.isArray(data.objeto)) return data.objeto
  return {
    id: 0,
    descricao: payload.descricao,
    resumo: payload.resumo,
    ativo: payload.ativo ?? true,
  }
}

export const atualizarAvaliacao = async (id: number, payload: AvaliacaoPayload): Promise<Avaliacao> => {
  const response = await api.put<AvaliacaoResponse>(`${AVALIACAO_BASE_PATH}/atualizar/${id}`, {
    id,
    ...payload,
  })
  const data = response.data
  if (!data.sucesso) {
    throw new Error(data.mensagens?.join(', ') || 'Falha ao atualizar avaliação')
  }
  if (data.objeto && !Array.isArray(data.objeto)) return data.objeto
  return {
    id,
    descricao: payload.descricao,
    resumo: payload.resumo,
    ativo: payload.ativo ?? true,
  }
}
