import { api } from '../api/http'
import { Habilidade, HabilidadeResponse } from '../types/habilidade'

export interface HabilidadeInput {
  tipo: number
  descricao: string
  resumo: string
  idNivelEnsino: number
  ativo?: boolean
}

function extractErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data
  if (data?.mensagens?.length) return data.mensagens.join(', ')
  return data?.mensagem || data?.message || fallback
}

export const habilidadesService = {
  /**
   * Busca habilidades com filtro por termo (código ou descrição)
   * Endpoint: GET /Habilidade/buscar?busca=termo
   */
  buscarHabilidades: async (busca: string = ''): Promise<Habilidade[]> => {
    try {
      const params = busca.trim() ? { busca: busca.trim() } : {};

      const response = await api.get<HabilidadeResponse>('/Habilidade/buscar', { params });

      // O backend retorna { objeto: [...] }
      const habilidades = response.data.objeto || [];

      return habilidades;
    } catch (error: any) {
      console.error('Erro ao buscar habilidades:', error);

      // Tratamento de erro mais amigável
      if (error.response?.status === 404 || error.response?.status === 204) {
        return []; // sem resultados = array vazio
      }

      if (error.code === 'ERR_NETWORK') {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }

      throw new Error(error.response?.data?.message || 'Erro ao carregar as habilidades.');
    }
  },

  // Opcional: buscar todas as habilidades (sem filtro)
  getAllHabilidades: async (): Promise<Habilidade[]> => {
    return habilidadesService.buscarHabilidades(); // chama sem termo
  },

  getHabilidadeById: async (id: number): Promise<HabilidadeInput & { id: number }> => {
    try {
      const response = await api.get(`/Habilidade/buscar/${id}`);
      const habilidade = response.data?.objeto ?? response.data;
      if (!habilidade?.id) throw new Error('Habilidade não encontrada');
      return habilidade;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar os dados da habilidade.'));
    }
  },

  createHabilidade: async (data: HabilidadeInput) => {
    try {
      const payload = {
        id: 0,
        idNivelEnsino: String(data.idNivelEnsino),
        tipo: String(data.tipo),
        descricao: data.descricao.trim(),
        resumo: data.resumo.trim(),
      };
      const response = await api.post('/Habilidade/cadastro', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Erro ao cadastrar a habilidade. Verifique os dados e tente novamente.'));
    }
  },

  updateHabilidade: async (id: number, data: HabilidadeInput) => {
    try {
      const payload = {
        id,
        idNivelEnsino: String(data.idNivelEnsino),
        tipo: String(data.tipo),
        descricao: data.descricao.trim(),
        resumo: (data.resumo || '').trim(),
        ativo: !!data.ativo,
      };
      const response = await api.patch('/Habilidade/atualizar', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error, 'Erro ao salvar. Verifique os dados e tente novamente.'));
    }
  },
};

export default habilidadesService;
