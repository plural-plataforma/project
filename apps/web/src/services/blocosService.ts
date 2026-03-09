// src/services/blocosService.ts
import api from '../api/http';
import { Bloco, BlocoCreateInput, BlocosResponse, BlocosQueryParams } from '../types/blocos';

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

      const response = await api.get<BlocosResponse>('/Blocos', { params });

      return response.data.blocos || [];
    } catch (error: any) {
      console.error('Erro ao listar blocos ativos:', error);
      throw new Error(error.response?.data?.message || 'Não foi possível carregar os blocos ativos.');
    }
  },

  /**
   * Lista TODOS os blocos filtrados (sem paginação no backend)
   * Retorna a lista completa para paginação no frontend
   */
  getBlocos: async (params?: {
    busca?: string;
    status?: boolean;
  }): Promise<Bloco[]> => {
    try {
      // Monta query params compatíveis com o backend atual
      const queryParams: any = {};

      if (params?.busca) {
        queryParams.busca = params.busca;
      }

      if (params?.status !== undefined) {
        queryParams.ativo = params.status;
      }

      // Remove page/pageSize para não paginar no backend
      delete queryParams.page;
      delete queryParams.pageSize;

      const response = await api.get<Bloco[]>('/Blocos', { params: queryParams });

      return response.data || [];
    } catch (error: any) {
      console.error('Erro ao listar blocos:', error);
      throw new Error(error.response?.data?.message || 'Não foi possível carregar os blocos.');
    }
  },

  /**
 * Lista TODOS os blocos filtrados (sem paginação)
 */
  getBlocosCompleto: async (params?: {
    busca?: string;
    status?: boolean;
  }): Promise<Bloco[]> => {
    try {
      const queryParams: any = {};

      if (params?.busca) queryParams.busca = params.busca;
      if (params?.status !== undefined) queryParams.ativo = params.status;

      // Força sem paginação
      const response = await api.get<Bloco[]>('/Blocos', { params: queryParams });

      return response.data || [];
    } catch (error: any) {
      console.error('Erro ao listar blocos completos:', error);
      throw new Error(error.response?.data?.message || 'Não foi possível carregar os blocos.');
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
      const response = await api.get<Bloco>(`/Blocos/${id}`);
      return response.data;
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