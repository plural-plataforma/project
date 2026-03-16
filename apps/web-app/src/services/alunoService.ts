import { api } from '@/api/http'
import type { Aluno, AlunoResponse } from '@/types/aluno'

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
  const response = await api.post<AlunoResponse>('/Aluno/cadastro', data)
  if (response.data.sucesso) {
    const obj = response.data.objeto
    if (Array.isArray(obj) && obj.length > 0) return obj[0]
    if (obj) return obj as unknown as Aluno
    return { ...data, id: 0 } as Aluno
  }
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao cadastrar aluno')
}

export const atualizaAluno = async (data: Partial<Aluno>): Promise<Aluno> => {
  if (!data.id) throw new Error('ID do aluno é obrigatório')
  const response = await api.patch<AlunoResponse>('/Aluno/atualizar', data)
  if (response.data.sucesso) {
    const obj = response.data.objeto
    if (Array.isArray(obj) && obj.length > 0) return obj[0]
    if (obj) return obj as unknown as Aluno
    return { ...data } as Aluno
  }
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar aluno')
}
