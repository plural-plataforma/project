import { Escola, EscolasResponse } from '@src/types/escolas';
import { api } from '../services/auth';

export const buscarEscolaPorId = async (id: number): Promise<Escola> => {
  try {
    const response = await api.get<EscolasResponse>(`/Escola/buscar/${id}`);
    console.log('✅ Resposta de buscarEscolaPorId:', response.data);
    
    if (response.data.sucesso && response.data.objeto) {
      // A API sempre retorna um array no campo objeto, mesmo para busca por ID
      if (Array.isArray(response.data.objeto)) {
        if (response.data.objeto.length > 0) {
          return response.data.objeto[0];
        }
      } else if (typeof response.data.objeto === 'object' && response.data.objeto !== null) {
        // Caso excepcional onde objeto não é um array
        return response.data.objeto as unknown as Escola;
      }
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
    
    // Verifica se listaObjetos existe e tem elementos
    if (response.data.sucesso && response.data.listaObjetos && response.data.listaObjetos.length > 0) {
      return response.data.listaObjetos;
    }
    
    // Se não houver listaObjetos mas tiver objeto, tenta usar objeto (compatibilidade)
    if (response.data.sucesso && (response.data as any).objeto) {
      const objeto = (response.data as any).objeto;
      if (Array.isArray(objeto)) {
        return objeto;
      } else {
        return [objeto];
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erro ao buscar escolas:', error);
    return [];
  }
};


export const atualizaEscolas = async (escolasData: Partial<Escola>): Promise<Escola> => {
  try {
    let response;
    if (escolasData.id) {
      // Se tem ID, usa a rota de atualização com método PATCH
      response = await api.patch<EscolasResponse>('/Escola/atualizar', escolasData);
      console.log('✅ Resposta de atualizarEscola:', response.data);
    } else {
      // Se não tem ID, usa a rota de cadastro
      response = await api.post<EscolasResponse>('/Escola/cadastro', escolasData);
      console.log('✅ Resposta de cadastrarEscola:', response.data);
    }
    if (response.data.sucesso && response.data.objeto) {
      if (Array.isArray(response.data.objeto)) {
        if (response.data.objeto.length > 0) {
          return response.data.objeto[0];
        }
      } else {
        return response.data.objeto as unknown as Escola;
      }
    }
    throw new Error('Falha ao salvar a escola');
  } catch (error) {
    console.error('❌ Erro ao salvar escola:', error);
    throw error;
  }
};