// src/services/blocosService.ts
import api from '../api/http';
import { Bloco, BlocoCreateInput, BlocosResponse, BlocosQueryParams } from '../types/blocos';

/** API pode serializar como camelCase ou PascalCase; normaliza para o tipo do front. */
function normalizeBlocoPayload(item: Record<string, unknown>): Bloco {
  return {
    id: Number(item.id ?? item.Id ?? 0),
    titulo: String(item.titulo ?? item.Titulo ?? ''),
    ordem: Number(item.ordem ?? item.Ordem ?? 0),
    observacao: (item.observacao ?? item.Observacao ?? null) as string | null,
    createdAt: String(item.createdAt ?? item.CreatedAt ?? ''),
    updatedAt: String(item.updatedAt ?? item.UpdatedAt ?? ''),
    status: Boolean(item.status ?? item.Status),
    icone: (item.icone ?? item.Icone ?? null) as string | null,
  };
}

function extractBlocosArray(data: unknown): Bloco[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const raw = d.blocos ?? d.Blocos;
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => normalizeBlocoPayload(row as Record<string, unknown>));
}

function extractTotal(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const d = data as Record<string, unknown>;
  const t = d.total ?? d.Total;
  return typeof t === 'number' ? t : Number(t) || 0;
}

export const blocosService = {
 /**
   * Lista TODOS os blocos ATIVOS (status = true), sem paginação pesada
   * Ideal para selects e dropdowns no cadastro
   */
  getAllBlocosAtivos: async (): Promise<Bloco[]> => {
    try {
      // Usa os parâmetros de query para filtrar apenas ativos e pegar muitos itens
      const params: BlocosQueryParams = {
        page: 1,
        pageSize: 1000,        // valor alto para pegar "todos" (ajuste se o backend limitar)
        ativo: true,           // ← filtro principal: só ativos
        // busca: undefined,   // sem busca para listar todos ativos
      };

      const response = await api.get('/Blocos', { params });

      return extractBlocosArray(response.data);
    } catch (error: any) {
      console.error('Erro ao listar blocos ativos:', error);
      throw new Error(error.response?.data?.message || 'Não foi possível carregar os blocos ativos.');
    }
  },
 
  /**
   * Busca lista paginada de blocos
   */
  getBlocos: async (params: BlocosQueryParams): Promise<BlocosResponse> => {
    try {
      const response = await api.get('/Blocos', { params });
      const list = extractBlocosArray(response.data);
      const total = extractTotal(response.data) || list.length;
      return { total, blocos: list };
    } catch (error) {
      console.error('Falha ao buscar blocos:', error);
      throw error;
    }
  },

  /**
   * Cria um novo bloco
   * @param data Dados do bloco a ser criado
   * @returns O bloco criado (com id gerado pelo backend)
   */
  createBloco: async (data: BlocoCreateInput): Promise<Bloco> => {
    try {
      const response = await api.post<Bloco>('/Blocos', data);
      return response.data;
    } catch (error: any) {
      console.error('Falha ao criar bloco:', error);
      
      // Tratamento mais amigável de erros (opcional)
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Dados inválidos. Verifique os campos obrigatórios.');
      }
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      
      throw error; // ou crie um erro customizado
    }
  },

/**
 * Busca um bloco específico pelo ID
 */
getBlocoById: async (id: number): Promise<Bloco> => {
  try {
    const response = await api.get(`/Blocos/${id}`);
    return normalizeBlocoPayload(response.data as Record<string, unknown>);
  } catch (error: any) {
    console.error(`Falha ao buscar bloco ${id}:`, error);
    
    if (error.response?.status === 404) {
      throw new Error('Bloco não encontrado.');
    }
    if (error.response?.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    throw new Error(error.response?.data?.message || 'Erro ao carregar os dados do bloco.');
  }
},
  /**
   * Exclui um bloco pelo ID
   * @param id ID do bloco a ser excluído
   * @returns Promise<void> - resolve se deletado com sucesso
   */
  deleteBloco: async (id: number): Promise<void> => {
    try {
      await api.delete(`/Blocos/${id}`);
      // Não retorna corpo no 200 OK, então só resolvemos a promise
    } catch (error: any) {
      console.error(`Falha ao excluir bloco ${id}:`, error);

      // Tratamento de erros comuns
      if (error.response?.status === 404) {
        throw new Error('Bloco não encontrado.');
      }
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para excluir este bloco.');
      }
      if (error.response?.status === 409) {
        throw new Error('Não é possível excluir: o bloco está em uso (ex: possui atividades associadas).');
      }

      throw new Error(error.response?.data?.message || 'Erro ao excluir o bloco. Tente novamente.');
    }
  },

   /**
   * Atualiza um bloco existente pelo ID
   * @param id ID do bloco a ser atualizado
   * @param data Novos dados do bloco (pode ser parcial)
   * @returns O bloco atualizado
   */
  updateBloco: async (id: number, data: Partial<BlocoCreateInput>): Promise<Bloco> => {
    try {
      const response = await api.put<Bloco>(`/Blocos/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Falha ao atualizar bloco ${id}:`, error);

      // Tratamento de erros mais amigável
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Dados inválidos. Verifique os campos obrigatórios.');
      }
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (error.response?.status === 404) {
        throw new Error('Bloco não encontrado.');
      }
      if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para atualizar este bloco.');
      }

      throw new Error(error.response?.data?.message || 'Erro ao atualizar o bloco. Tente novamente.');
    }
  },
};

export default blocosService;