import { AxiosError } from 'axios'
import { api } from '../api/http'

export interface LinksWhatsApp {
  morganaWhatsappUrl: string
  pluralWhatsappUrl: string
}

export interface LinkCheckout {
  pluralCheckoutUrlMensal: string
  pluralCheckoutUrlAnual: string
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

function normalizeLinksWhatsApp(data: Record<string, unknown> | LinksWhatsApp | undefined): LinksWhatsApp {
  if (!data) {
    return { morganaWhatsappUrl: '', pluralWhatsappUrl: '' }
  }

  return {
    morganaWhatsappUrl: String(
      (data as LinksWhatsApp).morganaWhatsappUrl
        ?? (data as Record<string, unknown>).MorganaWhatsappUrl
        ?? '',
    ),
    pluralWhatsappUrl: String(
      (data as LinksWhatsApp).pluralWhatsappUrl
        ?? (data as Record<string, unknown>).PluralWhatsappUrl
        ?? '',
    ),
  }
}

function normalizeLinkCheckout(data: Record<string, unknown> | LinkCheckout | undefined): LinkCheckout {
  if (!data) {
    return { pluralCheckoutUrlMensal: '', pluralCheckoutUrlAnual: '' }
  }

  return {
    pluralCheckoutUrlMensal: String(
      (data as LinkCheckout).pluralCheckoutUrlMensal
        ?? (data as Record<string, unknown>).PluralCheckoutUrlMensal
        ?? '',
    ),
    pluralCheckoutUrlAnual: String(
      (data as LinkCheckout).pluralCheckoutUrlAnual
        ?? (data as Record<string, unknown>).PluralCheckoutUrlAnual
        ?? '',
    ),
  }
}

export const configuracoesService = {
  /**
   * Busca os links atuais dos grupos de WhatsApp (Morgana e Plural)
   * Endpoint: GET /admin/configuracoes/whatsapp
   */
  getLinksWhatsApp: async (): Promise<LinksWhatsApp> => {
    try {
      const response = await api.get<ServiceResponse<LinksWhatsApp>>('/admin/configuracoes/whatsapp')
      return normalizeLinksWhatsApp(response.data.objeto)
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
      return normalizeLinksWhatsApp(response.data.objeto ?? data)
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao salvar os links. Verifique os dados e tente novamente.'))
    }
  },

  /**
   * Busca os links atuais de venda (checkout Hotmart) mensal e anual
   * Endpoint: GET /admin/configuracoes/checkout
   */
  getLinkCheckout: async (): Promise<LinkCheckout> => {
    try {
      const response = await api.get<ServiceResponse<LinkCheckout>>('/admin/configuracoes/checkout')
      return normalizeLinkCheckout(response.data.objeto)
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar os links de venda.'))
    }
  },

  /**
   * Atualiza os links de venda (checkout Hotmart) mensal e anual
   * Endpoint: PATCH /admin/configuracoes/checkout
   */
  updateLinkCheckout: async (data: LinkCheckout): Promise<LinkCheckout> => {
    try {
      const response = await api.patch<ServiceResponse<LinkCheckout>>('/admin/configuracoes/checkout', data)
      return normalizeLinkCheckout(response.data.objeto ?? data)
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao salvar os links. Verifique os dados e tente novamente.'))
    }
  },
}

export default configuracoesService
