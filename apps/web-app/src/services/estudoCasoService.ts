import { api } from '@/api/http'
import type {
  EstudoCasoAtualizacaoRequest,
  EstudoCasoCadastroRequest,
  EstudoCasoDetalhe,
  EstudoCasoEixoCatalogo,
  EstudoCasoListaItem,
} from '@/types/estudoCaso'

interface ServiceResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T | null
  listaObjetos?: T[] | null
}

function unwrapLista<T>(data: ServiceResponse<T>): T[] {
  if (!data.sucesso) throw new Error(data.mensagens?.join(', ') || 'Falha na API')
  return Array.isArray(data.listaObjetos) ? data.listaObjetos : []
}

function unwrapObjeto<T>(data: ServiceResponse<T>): T {
  if (!data.sucesso) throw new Error(data.mensagens?.join(', ') || 'Falha na API')
  if (data.objeto === undefined || data.objeto === null) throw new Error('Resposta sem objeto')
  return data.objeto
}

export const buscarEixosEstudoCasoCatalogo = async (): Promise<EstudoCasoEixoCatalogo[]> => {
  const { data } = await api.get<ServiceResponse<EstudoCasoEixoCatalogo>>('/EstudoDeCaso/eixos-catalogo')
  return unwrapLista(data)
}

export const listarEstudosCasoPorAluno = async (alunoId: number): Promise<EstudoCasoListaItem[]> => {
  const { data } = await api.get<ServiceResponse<EstudoCasoListaItem>>(
    `/EstudoDeCaso/por-aluno/${alunoId}`
  )
  return unwrapLista(data)
}

export const buscarEstudoCasoPorId = async (id: number): Promise<EstudoCasoDetalhe> => {
  const { data } = await api.get<ServiceResponse<EstudoCasoDetalhe>>(`/EstudoDeCaso/${id}`)
  return unwrapObjeto(data)
}

export const cadastrarEstudoCaso = async (payload: EstudoCasoCadastroRequest): Promise<EstudoCasoDetalhe> => {
  const { data } = await api.post<ServiceResponse<EstudoCasoDetalhe>>('/EstudoDeCaso/cadastro', payload)
  return unwrapObjeto(data)
}

export const atualizarEstudoCaso = async (
  id: number,
  payload: EstudoCasoAtualizacaoRequest
): Promise<EstudoCasoDetalhe> => {
  const { data } = await api.put<ServiceResponse<EstudoCasoDetalhe>>(`/EstudoDeCaso/${id}`, payload)
  return unwrapObjeto(data)
}

export const excluirEstudoCaso = async (id: number): Promise<void> => {
  const { data } = await api.delete<ServiceResponse<boolean>>(`/EstudoDeCaso/${id}`)
  if (!data.sucesso) throw new Error(data.mensagens?.join(', ') || 'Falha na API')
}

export const gerarTextoSimuladoEstudoCaso = async (id: number): Promise<EstudoCasoDetalhe> => {
  const { data } = await api.post<ServiceResponse<EstudoCasoDetalhe>>(
    `/EstudoDeCaso/${id}/gerar-texto-simulado`,
    {}
  )
  return unwrapObjeto(data)
}
