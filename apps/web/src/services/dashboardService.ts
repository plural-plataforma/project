import { api } from '../api/http';

export interface NivelRealizacaoContagem {
  nivel: string;
  quantidade: number;
}

export interface ResumoPedagogico {
  periodoInicio: string | null;
  periodoFim: string | null;
  avaliacoesCriadas: number;
  avaliacoesConcluidas: number;
  desempenhosRegistrados: number;
  desempenhosPorNivel: NivelRealizacaoContagem[];
  diagnosticosFinaisGerados: number;
}

/**
 * Resumo agregado de uso pedagógico (sem filtro por professor), usado pelo
 * Dashboard do Admin. Endpoint: GET /api/admin/dashboard/resumo-pedagogico.
 */
export const dashboardService = {
  getResumoPedagogico: async (params: { from?: Date; to?: Date } = {}): Promise<ResumoPedagogico> => {
    try {
      const response = await api.get('/admin/dashboard/resumo-pedagogico', {
        params: {
          from: params.from?.toISOString(),
          to: params.to?.toISOString(),
        },
      });
      return response.data?.objeto as ResumoPedagogico;
    } catch (error: unknown) {
      console.error('Erro ao buscar resumo pedagógico:', error);
      const err = error as { response?: { data?: { mensagens?: string[] } } };
      throw new Error(err.response?.data?.mensagens?.join(', ') || 'Não foi possível carregar o resumo pedagógico.');
    }
  },
};

export default dashboardService;
