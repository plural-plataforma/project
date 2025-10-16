import { Escola, EscolasResponse } from '@src/types/escolas';
import { api } from '../services/auth';

export const buscarEscolaPorId = async (id: number): Promise<Escola> => {
  try {
    const response = await api.get<{ objeto: Escola[], mensagens: string[], sucesso: boolean }>(`/Escola/buscar/${id}`);
    console.log('✅ Resposta de buscarEscolaPorId:', response.data);
    if (response.data.sucesso && Array.isArray(response.data.objeto) && response.data.objeto.length > 0) {
      return response.data.objeto[0];
    }
    throw new Error('Escola não encontrada');
  } catch (error) {
    console.error('❌ Erro ao buscar escola por ID:', error);
    throw error;
  }
};
export const buscarEscolas = async (): Promise<Escola[]> => {
  try {
    const response = await api.get<EscolasResponse>('/Escola/buscar');
    console.log('✅ Resposta de buscarEscolas:', response.data);
    return Array.isArray(response.data.objeto) ? response.data.objeto : [];
  } catch (error) {
    console.error('❌ Erro ao buscar escolas:', error);
    return [];
  }
};


export const atualizaEscolas = async (escolasData: Partial<Escola>): Promise<Escola> => {
  try {
    const response = await api.post<Escola>('/Escola/cadastro', escolasData);
    console.log('✅ Resposta de atualizaEscolas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao salvar escola:', error);
    throw error;
  }
};