import { BlocoComAtividade } from '@src/types/bloco';
import { api } from '../services/auth';

export const buscarBlocosComAtividades = async (): Promise<BlocoComAtividade[]> => {
  try {
    const response = await api.get<BlocoComAtividade[]>('/Blocos/com-atividades');
    return response.data ?? [];
  } catch (error) {
    console.error('❌ Erro ao buscar blocos:', error);
    return [];
  }
};
