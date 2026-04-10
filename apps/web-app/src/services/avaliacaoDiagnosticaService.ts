import { api } from '@/api/http'
import type {
  AvaliacaoDiagnosticaResumo,
  AvaliacaoDiagnosticaDetalhada,
  BlocoSelecionado,
  CreateAvaliacaoDiagnosticaRequest,
  CreateAvaliacaoDiagnosticaResponse,
  DesempenhoHistoricoResponse,
  DiagnosticoFinal,
  RegistrarDesempenhoBatchRequest,
} from '@/types/avaliacao-diagnostica'

interface ServiceResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T | null
  listaObjetos?: T[]
}

interface ServiceListResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T[] | null
  listaObjetos?: T[]
}

const AVALIACAO_DIAGNOSTICA_BASE_PATH = '/avaliacaodiagnostica'

const isNotFoundError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
  (error as { response?: { status?: number } }).response?.status === 404

const getList = <T>(responseData: ServiceListResponse<T> | T[]): T[] => {
  if (Array.isArray(responseData)) return responseData
  if (!responseData.sucesso) {
    throw new Error(responseData.mensagens?.join(', ') || 'Falha ao consultar API')
  }
  if (Array.isArray(responseData.objeto)) return responseData.objeto
  if (Array.isArray(responseData.listaObjetos)) return responseData.listaObjetos
  return []
}

const getObject = <T>(responseData: ServiceResponse<T> | T): T => {
  if (responseData && typeof responseData === 'object' && 'sucesso' in (responseData as object)) {
    const wrapped = responseData as ServiceResponse<T>
    if (!wrapped.sucesso) throw new Error(wrapped.mensagens?.join(', ') || 'Falha ao consultar API')
    if (wrapped.objeto && !Array.isArray(wrapped.objeto)) return wrapped.objeto
    throw new Error('Resposta inválida da API')
  }

  return responseData as T
}

export const buscarAvaliacoesDiagnosticas = async (): Promise<AvaliacaoDiagnosticaResumo[]> => {
  const response = await api.get<ServiceListResponse<Record<string, unknown>> | Array<Record<string, unknown>>>(
    `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/buscarTodos`
  )

  const data = getList(response.data)
  return data.map((a) => ({
    ...a,
    quantidadeAlunos: (a.quantidadeAlunos ?? a.totalAlunos ?? 0) as number,
    quantidadeBlocos: (a.quantidadeBlocos ?? a.totalBlocos ?? 0) as number,
    status: (a.status ?? (a.concluida ? 'Concluida' : 'EmAndamento')) as string,
    professorId: (a.professorId ?? null) as number | null,
  })) as AvaliacaoDiagnosticaResumo[]
}

export const buscarAvaliacaoPorId = async (id: number): Promise<AvaliacaoDiagnosticaDetalhada> => {
  const response = await api.get<ServiceResponse<AvaliacaoDiagnosticaDetalhada> | AvaliacaoDiagnosticaDetalhada>(
    `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/buscar/${id}`
  )

  return getObject(response.data)
}

export const criarAvaliacaoDiagnostica = async (
  dados: CreateAvaliacaoDiagnosticaRequest
): Promise<CreateAvaliacaoDiagnosticaResponse> => {
  const blocosPayload: BlocoSelecionado[] =
    dados.blocos ?? dados.blocoIds?.map((blocoId) => ({ blocoId, atividadeIds: [] })) ?? []

  const payload = {
    id: dados.id,
    titulo: dados.titulo,
    objetivo: dados.objetivo,
    dataAplicacao: dados.dataAplicacao,
    escolaId: dados.escolaId ?? null,
    alunoIds: dados.alunoIds,
    blocos: blocosPayload,
    concluida: dados.concluida ?? false,
  }

  const response = await api.post<ServiceResponse<AvaliacaoDiagnosticaDetalhada>>(
    `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/cadastro`,
    payload
  )

  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Erro ao criar avaliação diagnóstica')
  }

  if (response.data.objeto) {
    return {
      id: response.data.objeto.id,
      titulo: response.data.objeto.titulo,
      sucesso: true,
      message: response.data.mensagens?.[0],
    }
  }

  return {
    id: 0,
    titulo: dados.titulo,
    sucesso: true,
    message: response.data.mensagens?.[0] ?? 'Avaliação criada com sucesso',
  }
}

export const atualizarAvaliacaoDiagnostica = async (
  id: number,
  dados: CreateAvaliacaoDiagnosticaRequest
): Promise<CreateAvaliacaoDiagnosticaResponse> => {
  const blocosPayload: BlocoSelecionado[] =
    dados.blocos ?? dados.blocoIds?.map((blocoId) => ({ blocoId, atividadeIds: [] })) ?? []

  const payload = {
    id,
    titulo: dados.titulo,
    objetivo: dados.objetivo,
    dataAplicacao: dados.dataAplicacao,
    escolaId: dados.escolaId ?? null,
    alunoIds: dados.alunoIds,
    blocos: blocosPayload,
    concluida: dados.concluida ?? false,
  }

  const response = await api.put<ServiceResponse<AvaliacaoDiagnosticaDetalhada>>(
    `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/atualizar/${id}`,
    payload
  )

  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Erro ao atualizar avaliação diagnóstica')
  }

  if (response.data.objeto) {
    return {
      id: response.data.objeto.id,
      titulo: response.data.objeto.titulo,
      sucesso: true,
      message: response.data.mensagens?.[0],
    }
  }

  return {
    id,
    titulo: dados.titulo,
    sucesso: true,
    message: response.data.mensagens?.[0] ?? 'Avaliação atualizada com sucesso',
  }
}

export const registrarDesempenhoBatch = async (
  dados: RegistrarDesempenhoBatchRequest
): Promise<{ mensagem: string }> => {
  try {
    const response = await api.post<ServiceResponse<{ mensagem: string }> | { mensagem: string }>(
      `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/desempenhos/batch`,
      dados
    )
    const data = response.data
    if (data && typeof data === 'object' && 'sucesso' in data) {
      const wrapped = data as ServiceResponse<{ mensagem: string }>
      if (!wrapped.sucesso) {
        throw new Error(wrapped.mensagens?.join(', ') || 'Erro ao registrar desempenhos')
      }
      return wrapped.objeto ?? { mensagem: wrapped.mensagens?.[0] ?? 'Desempenhos registrados com sucesso.' }
    }

    return data as { mensagem: string }
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error('Registro de desempenhos em lote não está disponível neste ambiente da API.')
    }
    throw error
  }
}

export const buscarHistoricoDesempenho = async (
  avaliacaoId: number
): Promise<DesempenhoHistoricoResponse> => {
  try {
    const response = await api.get<ServiceResponse<DesempenhoHistoricoResponse> | DesempenhoHistoricoResponse>(
      `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/desempenhos/historico/${avaliacaoId}`
    )
    return getObject(response.data)
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error('Histórico de desempenho não está disponível neste ambiente da API.')
    }
    throw error
  }
}

export const buscarDiagnosticoFinal = async (
  avaliacaoId: number,
  alunoId: number
): Promise<DiagnosticoFinal> => {
  try {
    const response = await api.get<DiagnosticoFinal>(
      `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/diagnosticos-finais/${avaliacaoId}/${alunoId}`
    )
    return response.data
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error('Diagnóstico final não está disponível neste ambiente da API.')
    }
    throw error
  }
}

export const finalizarAvaliacao = async (id: number): Promise<{ mensagem: string }> => {
  const response = await api.put<ServiceResponse<AvaliacaoDiagnosticaDetalhada>>(
    `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/atualizar/${id}`,
    { id, concluida: true }
  )
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Erro ao finalizar avaliação')
  }
  return {
    mensagem: response.data.mensagens?.[0] ?? 'Avaliação finalizada com sucesso.',
  }
}

export const reivindicarAvaliacaoDiagnostica = async (id: number): Promise<{ mensagem: string }> => {
  const response = await api.patch<ServiceResponse<{ mensagem: string }>>(
    `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/reivindicar/${id}`
  )
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Erro ao reivindicar avaliação')
  }
  return response.data.objeto ?? { mensagem: 'Avaliação vinculada com sucesso.' }
}

export const gerarPdfBlob = async (avaliacaoId: number): Promise<Blob> => {
  try {
    const response = await api.get(
      `${AVALIACAO_DIAGNOSTICA_BASE_PATH}/gerar-pdf/${avaliacaoId}`,
      {
        responseType: 'blob',
      }
    )
    return response.data as Blob
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new Error('Geração de PDF não está disponível neste ambiente da API.')
    }
    throw error
  }
}
