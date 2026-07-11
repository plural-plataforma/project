import { AxiosError } from 'axios'
import { api } from '../api/http'

export interface LinksWhatsApp {
  morganaWhatsappUrl: string
  pluralWhatsappUrl: string
}

interface ServiceResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T
}

interface ErrorResponseData {
  mensagens?: string[]
  mensagem?: string
  message?: string
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as AxiosError<ErrorResponseData>)?.response?.data
  if (data?.mensagens?.length) return data.mensagens.join(', ')
  return data?.mensagem || data?.message || fallback
}

export const configuracoesService = {
  /**
   * Busca os links atuais dos grupos de WhatsApp (Morgana e Plural)
   * Endpoint: GET /admin/configuracoes/whatsapp
   */
  getLinksWhatsApp: async (): Promise<LinksWhatsApp> => {
    try {
      const response = await api.get<ServiceResponse<LinksWhatsApp>>('/admin/configuracoes/whatsapp')
      return response.data.objeto ?? { morganaWhatsappUrl: '', pluralWhatsappUrl: '' }
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar os links do WhatsApp.'))
    }
  },

  /**
   * Atualiza os links dos grupos de WhatsApp (Morgana e Plural)
   * Endpoint: PATCH /admin/configuracoes/whatsapp
   */
  updateLinksWhatsApp: async (data: LinksWhatsApp): Promise<LinksWhatsApp> => {
    try {
      const response = await api.patch<ServiceResponse<LinksWhatsApp>>('/admin/configuracoes/whatsapp', data)
      return response.data.objeto ?? data
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao salvar os links. Verifique os dados e tente novamente.'))
    }
  },
}

export default configuracoesService
