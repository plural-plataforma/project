import api from '../api/http';
import type { AxiosResponse } from 'axios';
import type { Atividade, AtividadeCreateInput } from '../types/atividades';

export interface AtividadesPaginadas {
  itens: Atividade[];
  total: number;
  page: number;
  pageSize: number;
}

function apiErrorMessage(error: { response?: { data?: Record<string, unknown> } }, fallback: string): string {
  const d = error.response?.data;
  if (!d || typeof d !== 'object') return fallback;
  const m = d.mensagens ?? d.Mensagens;
  if (Array.isArray(m) && m.length) return (m as string[]).filter(Boolean).join(', ');
  const msg = d.message ?? d.Message;
  if (typeof msg === 'string' && msg) return msg;
  return fallback;
}

export const atividadesService = {
  /**
   * Cria uma nova atividade (POST /api/atividades)
   * Usa multipart/form-data por causa do upload de imagem
   */
  createAtividade: async (data: AtividadeCreateInput): Promise<Atividade> => {
    try {
      const formData = new FormData();

      // Campos obrigatórios
      formData.append('titulo', data.titulo);
      formData.append('blocoId', data.blocoId.toString());
      formData.append('nivel', data.nivel);
      formData.append('etapaMin', data.etapaMin);

      // Campos opcionais
      if (data.enunciado) formData.append('enunciado', data.enunciado);
      if (data.etapaMax) formData.append('etapaMax', data.etapaMax);

      // Array de habilidades (enviar como múltiplos valores com o mesmo nome)
      data.habilidadesIds.forEach(id => {
        formData.append('HabilidadeIds', id.toString());
      });

      // Imagem (se houver)
      if (data.imagemUrl) {
        formData.append('imagemUrl', data.imagemUrl);
      }

      const response: AxiosResponse<Atividade> = await api.post('/atividades', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar atividade:', error);

      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Dados inválidos. Verifique os campos obrigatórios.');
      }
      if (error.response?.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      if (error.response?.status === 413) {
        throw new Error('Arquivo muito grande. Limite: 5MB.');
      }

      throw new Error(error.response?.data?.message || 'Erro ao criar a atividade.');
    }
  },

  /**
   * Busca atividades com filtros e paginação real (page/pageSize aplicados no backend).
   * GET /api/atividades — retorna { itens, total, page, pageSize } dentro de `objeto`.
   */
  getAtividadesPaginado: async (params: {
    busca?: string;
    blocoId?: number;
    nivel?: string;
    etapa?: string;
    ativo?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<AtividadesPaginadas> => {
    try {
      const response = await api.get('/atividades', {
        params: {
          busca: params.busca,
          blocoId: params.blocoId,
          nivel: params.nivel,
          etapa: params.etapa,
          ativo: params.ativo,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        },
      });

      const objeto = response.data?.objeto;

      // Formato atual: { itens, total, page, pageSize }
      if (objeto && Array.isArray(objeto.itens)) {
        return {
          itens: objeto.itens,
          total: objeto.total ?? objeto.itens.length,
          page: objeto.page ?? params.page ?? 1,
          pageSize: objeto.pageSize ?? params.pageSize ?? 10,
        };
      }

      // Fallback (formato antigo: objeto era array direto)
      if (Array.isArray(objeto)) {
        return { itens: objeto, total: objeto.length, page: params.page ?? 1, pageSize: params.pageSize ?? 10 };
      }

      console.warn('Formato de resposta inesperado:', response.data);
      return { itens: [], total: 0, page: params.page ?? 1, pageSize: params.pageSize ?? 10 };
    } catch (error: any) {
      console.error('Erro ao buscar atividades:', error);
      throw new Error(error.response?.data?.mensagens?.join(', ') || 'Falha ao carregar atividades.');
    }
  },

  /**
   * Busca atividades e retorna só a lista (sem total) — usado por telas que
   * precisam de todas as atividades para calcular estatísticas (ex.: dashboards).
   * Passe `pageSize` grande o suficiente para cobrir o volume esperado.
   */
  getAtividades: async (params: {
    busca?: string;
    blocoId?: number;
    nivel?: string;
    etapa?: string;
    ativo?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<Atividade[]> => {
    const { itens } = await atividadesService.getAtividadesPaginado(params);
    return itens;
  },
  // Outros métodos úteis (futuro)

  /**
   * Busca uma atividade por ID
   * GET /api/atividades/{id}
   */
  getAtividadeById: async (id: number): Promise<Atividade> => {
    try {
      const response = await api.get(`/atividades/${id}`);
      const data = response.data;

      // Extrai o conteúdo real da atividade (está dentro de 'objeto')
      if (data && data.sucesso && data.objeto) {
        return data.objeto;  // retorna só { id, titulo, enunciado, ... }
      }

      // Fallback caso o formato mude ou seja direto
      return data as Atividade;
    } catch (error: any) {
      console.error('Erro ao buscar atividade:', error);
      throw new Error(error.response?.data?.mensagens?.join(', ') || 'Atividade não encontrada.');
    }
  },

  /**
   * Atualiza uma atividade existente
   * PUT /api/atividades/{id}
   * Usa multipart/form-data por causa da imagem
   */
  updateAtividade: async (id: number, data: Partial<AtividadeCreateInput> & { Id?: number }): Promise<Atividade> => {
    try {
      const formData = new FormData();

      if (data.titulo !== undefined) formData.append('Titulo', data.titulo);
      if (data.enunciado !== undefined) formData.append('enunciado', data.enunciado);
      if (data.blocoId !== undefined) formData.append('blocoId', data.blocoId.toString());
      if (data.nivel !== undefined) formData.append('nivel', data.nivel);
      if (data.etapaMin !== undefined) formData.append('etapaMin', data.etapaMin);
      if (data.etapaMax !== undefined) formData.append('etapaMax', data.etapaMax || '');

      // Habilidades: se enviado, atualiza a lista completa
      if (data.habilidadesIds !== undefined) {
        data.habilidadesIds.forEach(id => formData.append('HabilidadeIds', id.toString()));
      }

      // Imagem: só append se houver nova imagem
      if (data.imagemUrl) {
        formData.append('imagemUrl', data.imagemUrl);
      }

      const response = await api.put(`/atividades/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar atividade:', error);
      throw new Error(error.response?.data?.mensagens?.join(', ') || 'Erro ao atualizar a atividade.');
    }
  },
  /**
 * Exclui uma atividade por ID
 * DELETE /api/atividades/{id}
 */
  deleteAtividade: async (id: number): Promise<void> => {
    try {
      await api.delete(`/atividades/${id}`);
    } catch (error: unknown) {
      console.error('Erro ao excluir atividade:', error);
      const err = error as { response?: { status?: number; data?: Record<string, unknown> } };
      if (err.response?.status === 404) {
        throw new Error('Atividade não encontrada.');
      }
      if (err.response?.status === 403 || err.response?.status === 401) {
        throw new Error('Sem permissão para excluir esta atividade.');
      }
      throw new Error(apiErrorMessage(err, 'Erro ao excluir a atividade.'));
    }
  },
};

export default atividadesService;