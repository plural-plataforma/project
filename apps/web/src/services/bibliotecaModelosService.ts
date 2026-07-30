import { AxiosError } from 'axios'
import { api } from '../api/http'

export interface DocumentoBiblioteca {
  id: number
  nome: string
  categoria?: string | null
  nomeArquivoOriginal: string
  tamanhoBytes: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface DocumentoBibliotecaFormData {
  nome: string
  categoria?: string
  arquivo?: File | null
}

interface ServiceResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as AxiosError<{ mensagens?: string[] }>)?.response?.data
  if (data?.mensagens?.length) return data.mensagens.join(', ')
  return fallback
}

function buildFormData(data: DocumentoBibliotecaFormData): FormData {
  const formData = new FormData()
  formData.append('nome', data.nome)
  if (data.categoria) formData.append('categoria', data.categoria)
  if (data.arquivo) formData.append('arquivo', data.arquivo)
  return formData
}

export const bibliotecaModelosService = {
  listar: async (): Promise<DocumentoBiblioteca[]> => {
    try {
      const response = await api.get<ServiceResponse<DocumentoBiblioteca[]>>('/biblioteca-modelos')
      return response.data.objeto ?? []
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar a biblioteca de modelos.'))
    }
  },

  criar: async (data: DocumentoBibliotecaFormData): Promise<DocumentoBiblioteca> => {
    try {
      const response = await api.post<ServiceResponse<DocumentoBiblioteca>>(
        '/biblioteca-modelos',
        buildFormData(data),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return response.data.objeto as DocumentoBiblioteca
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao enviar o documento. Verifique o arquivo e tente novamente.'))
    }
  },

  atualizar: async (id: number, data: DocumentoBibliotecaFormData): Promise<DocumentoBiblioteca> => {
    try {
      const response = await api.put<ServiceResponse<DocumentoBiblioteca>>(
        `/biblioteca-modelos/${id}`,
        buildFormData(data),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return response.data.objeto as DocumentoBiblioteca
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao atualizar o documento.'))
    }
  },

  excluir: async (id: number): Promise<void> => {
    try {
      await api.delete(`/biblioteca-modelos/${id}`)
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao excluir o documento.'))
    }
  },

  baixar: async (documento: DocumentoBiblioteca): Promise<void> => {
    const response = await api.get(`/biblioteca-modelos/${documento.id}/download`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data as Blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = documento.nomeArquivoOriginal
    link.click()
    URL.revokeObjectURL(url)
  },
}

export default bibliotecaModelosService
