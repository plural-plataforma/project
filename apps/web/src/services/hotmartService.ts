import { api } from '../api/http';

export interface VendaHotmart {
  transaction: string;
  status: string;
  productId: number;
  productName: string;
  buyerEmail: string;
  buyerName: string;
  totalValue: number;
  createdDate: string;
  jaCadastradoComoProfessor: boolean;
  statusCadastro: string;
  nomeCompleto: string | null;
  telefone: string | null;
  nivelEnsino: string | null;
  professorId: number | null;
  ativo: boolean | null;
  isEmbaixadora: boolean | null;
  roles: string[] | null;
}

export interface VendasHotmartResumo {
  total: number;
  cadastrados: number;
  naoCadastrados: number;
  data: VendaHotmart[];
}

/**
 * Consulta vendas na Hotmart cruzadas com o cadastro de professores na
 * plataforma. Endpoint: GET /api/vendas/hotmart.
 */
export const hotmartService = {
  getVendasComStatusCadastro: async (params: {
    productId?: number;
    transactionStatus?: string;
    from?: Date;
    to?: Date;
  } = {}): Promise<VendasHotmartResumo> => {
    try {
      const response = await api.get('/vendas/hotmart', {
        params: {
          productId: params.productId,
          transactionStatus: params.transactionStatus,
          from: params.from?.toISOString(),
          to: params.to?.toISOString(),
        },
      });
      return response.data as VendasHotmartResumo;
    } catch (error: unknown) {
      console.error('Erro ao buscar vendas Hotmart:', error);
      const err = error as { response?: { data?: { detalhe?: string; erro?: string } } };
      throw new Error(err.response?.data?.detalhe || err.response?.data?.erro || 'Não foi possível carregar as vendas.');
    }
  },
};

export default hotmartService;
