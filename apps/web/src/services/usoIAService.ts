import { api } from '../api/http'

export interface UsoIAPorTipo {
  tipoDocumento: string
  total: number
  sucesso: number
}

export interface UsoIAPorProfessora {
  professorId: number
  nomeCompleto: string
  total: number
  sucesso: number
  estudoCaso: number
  paee: number
  avaliacaoDiagnostica: number
  relatoAtendimento: number
  ultimaGeracao: string | null
}

export interface UsoIA {
  periodoInicio: string | null
  periodoFim: string | null
  totalGeracoes: number
  totalSucesso: number
  totalFalha: number
  totalProfessoras: number
  professorasAtivasNoPeriodo: number
  professorasSemUsoNunca: number
  porTipoDocumento: UsoIAPorTipo[]
  porProfessora: UsoIAPorProfessora[]
}

/**
 * Uso dos 4 geradores de texto por IA, agregado por professora e por tipo de
 * documento. Endpoint: GET /api/admin/dashboard/uso-ia.
 */
export const usoIAService = {
  getUsoIA: async (params: { from?: Date; to?: Date } = {}): Promise<UsoIA> => {
    try {
      const response = await api.get('/admin/dashboard/uso-ia', {
        params: {
          from: params.from?.toISOString(),
          to: params.to?.toISOString(),
        },
      })
      return response.data?.objeto as UsoIA
    } catch (error: unknown) {
      console.error('Erro ao buscar uso de IA:', error)
      const err = error as { response?: { data?: { mensagens?: string[] } } }
      throw new Error(err.response?.data?.mensagens?.join(', ') || 'Não foi possível carregar o uso de IA.')
    }
  },
}

export default usoIAService
