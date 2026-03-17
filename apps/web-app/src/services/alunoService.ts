import { api } from '@/api/http'
import type { Aluno, AlunoResponse } from '@/types/aluno'
import { type AxiosError } from 'axios'

type ApiErrorData = {
  mensagens?: string[]
  message?: string
  title?: string
  errors?: string[] | Record<string, string[]>
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<ApiErrorData>
  const data = axiosError.response?.data

  if (data) {
    if (Array.isArray(data.mensagens) && data.mensagens.length > 0) {
      return data.mensagens.join(', ')
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }

    if (typeof data.title === 'string' && data.title.trim()) {
      return data.title
    }

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0] ?? fallback
    }

    if (data.errors && typeof data.errors === 'object') {
      const firstError = Object.values(data.errors).flat()[0]
      if (firstError) return firstError
    }
  }

  return axiosError.message || fallback
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
