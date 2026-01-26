import { api } from '../api/http'
import { Habilidade, HabilidadeResponse } from '../types/habilidade'

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
};

export default habilidadesService;