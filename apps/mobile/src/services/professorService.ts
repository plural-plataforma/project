import axios, { AxiosError } from 'axios';
import { Professor, ProfessorResponse, ProfessorError } from '../types/professor';
import { Escola } from '../types/escolas';
import { api, getToken } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const buscarProfessor = async (): Promise<ProfessorResponse> => {
  const token = await getToken(); // Assumindo que usa isso
  if (!token) {
    console.warn('⚠️ Nenhum token em buscarProfessor, abortando...');
    throw new Error('Nenhum token encontrado no AsyncStorage');
  }
  try {
    const response = await api.get<ProfessorResponse>('/Professor/buscar/');
    if (!response.data) {
      throw new Error('Resposta vazia da API');
    }

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ProfessorError>;

    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao buscar dados do professor';
    throw new Error(msg);
  }
};

export const buscarEscolasProfessor = async (): Promise<Escola[]> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error('Nenhum token encontrado no AsyncStorage');
  }
  try {
    const response = await api.get<{ objeto: Escola[] }>('/Professor/buscarescolas');
    if (!response.data || !Array.isArray(response.data.objeto)) {
      throw new Error('Resposta vazia ou formato inválido da API');
    }
    return response.data.objeto;
  } catch (error) {
    const axiosError = error as AxiosError<ProfessorError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao buscar escolas do professor';
    throw new Error(msg);
  }
};

export const vincularEscola = async (idEscola: number) => {
  try {
    const response = await api.post('/Professor/vincularescola', { idEscola });
    const data = response.data;
    
    // FIX: Se já vinculada, considera sucesso (não joga erro)
    if (!data.sucesso && data.mensagens && data.mensagens.includes('Este professor já está vinculado a essa escola.')) {
      console.log(`✅ Escola ID ${idEscola} já está vinculada (ignorando).`);
      return { ...data, sucesso: true }; // Retorna como sucesso para o chamador
    }
    
    if (!data.sucesso) {
      throw new Error(data.mensagens?.join(', ') || 'Falha ao vincular escola');
    }
    
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<ProfessorError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao vincular escola';
    throw new Error(msg);
  }
};

// NOVO: Função para desvincular escola (assumindo endpoint similar: POST /Professor/desvincularescola)
export const desvincularEscola = async (idEscola: number) => {
  try {
    const response = await api.post('/Professor/desvincularescola', { idEscola });
    const data = response.data;
    
    // Se não estava vinculada, considera sucesso (similar ao vincular)
    if (!data.sucesso && data.mensagens && data.mensagens.includes('Este professor não está vinculado a essa escola.')) {
      console.log(`✅ Escola ID ${idEscola} já não está vinculada (ignorando).`);
      return { ...data, sucesso: true };
    }
    
    if (!data.sucesso) {
      throw new Error(data.mensagens?.join(', ') || 'Falha ao desvincular escola');
    }
    
    return data;
  } catch (error) {
    const axiosError = error as AxiosError<ProfessorError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao desvincular escola';
    throw new Error(msg);
  }
};

// NOVO: Função para atualizar apenas as escolas alteradas (usando diff: adds e removes)
export const atualizarEscolasProfessor = async (payload: { acoes: Array<{ tipo: 'adicionar' | 'remover'; escolaId: number }> }) => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error('Nenhum token encontrado no AsyncStorage');
  }

  let errors: string[] = [];
  let successCount = 0;

  for (const acao of payload.acoes) {
    try {
      if (acao.tipo === 'adicionar') {
        await vincularEscola(acao.escolaId);
        successCount++;
      } else if (acao.tipo === 'remover') {
        await desvincularEscola(acao.escolaId);
        successCount++;
      }
    } catch (error: any) {
      console.warn(`⚠️ Falha na ação ${acao.tipo} para escola ${acao.escolaId}: ${error.message}`);
      errors.push(`${acao.tipo} escola ${acao.escolaId}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    const msg = `Algumas ações falharam: ${errors.join('; ')}`;
    console.warn('⚠️ Erros parciais em atualizarEscolasProfessor:', msg);
    // Não joga erro aqui (sucesso parcial), mas retorna com detalhes
    return {
      sucesso: successCount > 0,
      mensagens: errors.length > 0 ? [msg] : [],
      objeto: true,
      listaObjetos: []
    };
  }

  return {
    sucesso: true,
    mensagens: [`Atualizadas ${successCount} ações com sucesso.`],
    objeto: true,
    listaObjetos: []
  };
};

export const atualizarProfessor = async (professorData: Professor) => {
  let normalizedData: Professor = { ...professorData, escolas: [] };
  try {
    // Normalizar o campo escolas
    normalizedData = {
      ...professorData,
      escolas: Array.isArray(professorData.escolas)
        ? professorData.escolas.length > 0
          ? professorData.escolas
          : []
        : professorData.escolas
          ? [professorData.escolas]
          : [],
    };

    // Atualizar dados do professor, excluindo escolas 
    const professorPayload = { ...normalizedData, escolas: [] };
    const response = await api.patch('/Professor/atualizar/', professorPayload);

    // NOVO: Em vez de loop com vincular, chame atualizarEscolasProfessor com diff
    // Mas como isso é chamado no componente com escolas vazias, o diff é feito lá
    // Aqui, só atualiza o professor (escolas são tratadas separadamente no componente)

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ProfessorError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao atualizar dados do professor';
    throw new Error(msg);
  }
};