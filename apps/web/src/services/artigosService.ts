import { AxiosError } from 'axios'
import { api } from '../api/http'

export interface Artigo {
  id: number
  titulo: string
  slug: string
  categoria?: string | null
  autor: string
  imagemCapaUrl?: string | null
  publicado: boolean
  publicadoEm?: string | null
  ativo: boolean
  updatedAt: string
}

export interface ArtigoDetalhe extends Artigo {
  resumo: string
  conteudo: string
  tempoLeituraMinutos: number
  createdAt: string
}

export interface ArtigoFormData {
  titulo: string
  slug?: string
  resumo: string
  conteudo: string
  categoria?: string
  autor: string
  tempoLeituraMinutos: number
  imagemCapaUrl?: string
  publicado: boolean
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

export const artigosService = {
  listar: async (): Promise<Artigo[]> => {
    try {
      const response = await api.get<ServiceResponse<Artigo[]>>('/artigos')
      return response.data.objeto ?? []
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar os artigos.'))
    }
  },

  buscarPorId: async (id: number): Promise<ArtigoDetalhe> => {
    try {
      const response = await api.get<ServiceResponse<ArtigoDetalhe>>(`/artigos/${id}`)
      return response.data.objeto as ArtigoDetalhe
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar o artigo.'))
    }
  },

  criar: async (data: ArtigoFormData): Promise<ArtigoDetalhe> => {
    try {
      const response = await api.post<ServiceResponse<ArtigoDetalhe>>('/artigos', data)
      return response.data.objeto as ArtigoDetalhe
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao criar o artigo.'))
    }
  },

  atualizar: async (id: number, data: Partial<ArtigoFormData>): Promise<ArtigoDetalhe> => {
    try {
      const response = await api.put<ServiceResponse<ArtigoDetalhe>>(`/artigos/${id}`, data)
      return response.data.objeto as ArtigoDetalhe
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao atualizar o artigo.'))
    }
  },

  excluir: async (id: number): Promise<void> => {
    try {
      await api.delete(`/artigos/${id}`)
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao excluir o artigo.'))
    }
  },
}

export default artigosService
