import { Escola, EscolasResponse } from '@src/types/escolas';
import { api } from '../services/auth';

export const buscarEscolaPorId = async (id: number): Promise<Escola> => {
  try {
    const response = await api.get<EscolasResponse>(`/Escola/buscar/${id}`);
    
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
    } else {
      // Se não tem ID, usa a rota de cadastro
      response = await api.post<EscolasResponse>('/Escola/cadastro', escolasData);
    }

    // FIX: Verifica só 'sucesso' primeiro; se true, considera salvo (mesmo com objeto null)
    if (response.data.sucesso) {
      if (response.data.objeto) {
        // Se objeto existe, usa ele (como antes)
        if (Array.isArray(response.data.objeto)) {
          if (response.data.objeto.length > 0) {
            return response.data.objeto[0];
          }
        } else {
          return response.data.objeto as unknown as Escola;
        }
      } else {
        // FIX: Se objeto é null (mas sucesso=true), retorna os dados de entrada como "salvo"
        // (Adicione um ID gerado se for post, ou use o existente; ajuste conforme sua necessidade)
        const savedEscola: Escola = {
          ...escolasData as Escola, // Converte Partial para Escola completo
          id: escolasData.id || 0, // Mantém ID se existir; senão 0 (pode ser ajustado pro ID real da API se exposto em outro campo)
        };
        return savedEscola;
      }
    }
    
    // Só lança erro se !sucesso
    throw new Error('Falha ao salvar a escola');
  } catch (error) {
    console.error('❌ Erro ao salvar escola:', error);
    throw error;
  }
};

// services/professorService.ts
export const vincularEscolaProfessor = async (idEscola: number) => {
  return api.post('/Professor/vincularescola', {
    idEscola,
  });
};

export const desvincularEscolaProfessor = async (idEscola: number) => {
  return api.post('/Professor/desvincularescola', {
    idEscola,
  });
};
