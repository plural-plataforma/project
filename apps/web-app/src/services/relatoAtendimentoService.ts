import { api } from '@/api/http'
import type {
  RelatoListaResponse,
  RelatoAtendimento,
  RelatoCadastroPayload,
  RelatoAtualizarPayload,
  RelatoSugestoesMesResponse,
} from '@/types/relatoAtendimento'

function extrairLista(r: RelatoListaResponse): RelatoAtendimento[] {
  if (!r.sucesso) return []
  if (Array.isArray(r.listaObjetos)) return r.listaObjetos
  return []
}

export const listarRelatos = async (params?: {
  alunoId?: number
  dataInicio?: string
  dataFim?: string
}): Promise<RelatoAtendimento[]> => {
  const response = await api.get<RelatoListaResponse>('/RelatoAtendimento/listar', { params })
  return extrairLista(response.data)
}

export const relatorioConsolidadoRelatos = async (params: {
  dataInicio: string
  dataFim: string
  alunoId?: number
}): Promise<RelatoAtendimento[]> => {
  const response = await api.get<RelatoListaResponse>('/RelatoAtendimento/relatorio-consolidado', {
    params,
  })
  return extrairLista(response.data)
}

export const obterSugestoesMesRelato = async (alunoId: number, ano: number, mes: number) => {
  const response = await api.get<RelatoSugestoesMesResponse>('/RelatoAtendimento/sugestoes-mes', {
    params: { alunoId, ano, mes },
  })
  if (!response.data.sucesso)
    throw new Error(response.data.mensagens?.join(', ') ?? 'Não foi possível carregar sugestões')
  return response.data.objeto
}

export const cadastrarRelato = async (payload: RelatoCadastroPayload): Promise<RelatoAtendimento> => {
  interface CadastroResponse extends RelatoListaResponse {
    objeto?: RelatoAtendimento
  }
  const response = await api.post<CadastroResponse>('/RelatoAtendimento/cadastro', payload)
  if (!response.data.sucesso || !response.data.objeto) {
    throw new Error(response.data.mensagens?.join(', ') ?? 'Falha ao registrar relato')
  }
  return response.data.objeto
}

export const atualizarRelato = async (payload: RelatoAtualizarPayload): Promise<RelatoAtendimento> => {
  interface PatchResponse extends RelatoListaResponse {
    objeto?: RelatoAtendimento
  }
  const response = await api.patch<PatchResponse>('/RelatoAtendimento/atualizar', payload)
  if (!response.data.sucesso || !response.data.objeto) {
    throw new Error(response.data.mensagens?.join(', ') ?? 'Falha ao atualizar relato')
  }
  return response.data.objeto
}

export const excluirRelato = async (id: number): Promise<void> => {
  const response = await api.delete<{ sucesso: boolean; mensagens: string[] }>(`/RelatoAtendimento/${id}`)
  if (!response.data.sucesso)
    throw new Error(response.data.mensagens?.join(', ') ?? 'Falha ao excluir relato')
}
