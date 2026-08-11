import { api } from '../api/http'

export interface PromptSistemaIA {
  id: number
  tipoDocumento: string
  conteudo: string
  updatedAt: string
}

interface ServiceResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { mensagens?: string[] } } })?.response?.data
  if (data?.mensagens?.length) return data.mensagens.join(', ')
  return fallback
}

export const promptsIAService = {
  listar: async (): Promise<PromptSistemaIA[]> => {
    try {
      const response = await api.get<ServiceResponse<PromptSistemaIA[]>>('/prompt-sistema-ia')
      return response.data.objeto ?? []
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar os prompts de IA.'))
    }
  },

  atualizar: async (tipoDocumento: string, conteudo: string): Promise<PromptSistemaIA> => {
    try {
      const response = await api.put<ServiceResponse<PromptSistemaIA>>(
        `/prompt-sistema-ia/${tipoDocumento}`,
        { conteudo },
      )
      return response.data.objeto as PromptSistemaIA
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao salvar o prompt.'))
    }
  },
}

export default promptsIAService
