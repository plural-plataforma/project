import { api } from '@/api/http'
import type { Aluno, AlunoResponse } from '@/types/aluno'
import { getApiErrorMessageForUser } from '@/lib/apiFriendlyError'

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const msg = getApiErrorMessageForUser(error).trim()
  return msg || fallback
}

export const buscarAlunos = async (): Promise<Aluno[]> => {
  const response = await api.get<AlunoResponse>('/Aluno/buscar')
  if (!response.data.sucesso) return []
  if (Array.isArray(response.data.objeto)) return response.data.objeto
  if (Array.isArray(response.data.listaObjetos)) return response.data.listaObjetos!
  return []
}

export const buscarAlunoPorId = async (id: number): Promise<Aluno> => {
  const response = await api.get<AlunoResponse>(`/Aluno/buscar/${id}`)
  if (response.data.sucesso && response.data.objeto) {
    const obj = response.data.objeto
    if (Array.isArray(obj) && obj.length > 0) return obj[0]
    return obj as unknown as Aluno
  }
  throw new Error('Aluno não encontrado')
}

export const cadastraAluno = async (data: Partial<Aluno>): Promise<Aluno> => {
  try {
    const response = await api.post<AlunoResponse>('/Aluno/cadastro', data)
    if (response.data.sucesso) {
      const obj = response.data.objeto
      if (Array.isArray(obj) && obj.length > 0) return obj[0]
      if (obj) return obj as unknown as Aluno
      return { ...data, id: 0 } as Aluno
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao cadastrar aluno')
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Falha ao cadastrar aluno'))
  }
}

export const atualizaAluno = async (data: Partial<Aluno>): Promise<Aluno> => {
  if (!data.id) throw new Error('ID do aluno é obrigatório')
  try {
    const response = await api.patch<AlunoResponse>('/Aluno/atualizar', data)
    if (response.data.sucesso) {
      const obj = response.data.objeto
      if (Array.isArray(obj) && obj.length > 0) return obj[0]
      if (obj) return obj as unknown as Aluno
      return { ...data } as Aluno
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar aluno')
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Falha ao atualizar aluno'))
  }
}

type ExcluirAlunoResponse = { sucesso: boolean; mensagens?: string[] }

export const excluirAluno = async (id: number): Promise<void> => {
  try {
    const response = await api.delete<ExcluirAlunoResponse>(`/Aluno/${id}`)
    if (response.data.sucesso) return
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao excluir aluno')
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Falha ao excluir aluno'))
  }
}
