import { api } from '../api/http'

export interface UsoIAPorTipo {
  tipoDocumento: string
  total: number
  sucesso: number
  professorasDistintas: number
}

export interface UsoIAFaixaUso {
  faixa: string
  professoras: number
}

export interface UsoIAPorDia {
  /** Data no horário de Brasília (YYYY-MM-DD). */
  data: string
  total: number
  sucesso: number
  falha: number
  bloqueiosLimite: number
  professorasDistintas: number
}

export interface UsoIAPorHora {
  /** Hora no horário de Brasília (0–23). */
  hora: number
  total: number
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
  relatorioPedagogico: number
  relatorioTextoFinal: number
  bloqueiosLimite: number
  diasAtivos: number
  maximoEmUmDia: number
  alunosDistintos: number
  usoMesAtual: number
  limiteMensalAtingido: boolean
  primeiraGeracao: string | null
  ultimaGeracao: string | null
}

export interface UsoIA {
  periodoInicio: string | null
  periodoFim: string | null
  /** Tentativas que chamaram a IA (sucesso + falha); bloqueios por limite ficam à parte. */
  totalGeracoes: number
  totalSucesso: number
  totalFalha: number
  totalBloqueiosLimite: number
  custoEstimadoReais: number
  totalProfessoras: number
  professorasAtivasNoPeriodo: number
  professorasSemUsoNunca: number
  professorasComBloqueioNoPeriodo: number
  mediaGeracoesPorProfessoraAtiva: number
  medianaGeracoesPorProfessoraAtiva: number
  percentil90GeracoesPorProfessoraAtiva: number
  limiteDiario: number
  limiteMensal: number
  /** Mês corrente (horário de Brasília), independente do período filtrado. */
  professorasNoLimiteMensalMesAtual: number
  porTipoDocumento: UsoIAPorTipo[]
  faixasUso: UsoIAFaixaUso[]
  porDia: UsoIAPorDia[]
  porHora: UsoIAPorHora[]
  porProfessora: UsoIAPorProfessora[]
}

/**
 * Uso dos geradores de texto por IA (todos os tipos de documento), agregado por
 * professora, tipo, dia e hora, com limites de uso vigentes. Endpoint: GET /api/admin/dashboard/uso-ia.
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
