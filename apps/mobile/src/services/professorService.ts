import axios, { AxiosError } from 'axios';
import { Professor, ProfessorResponse, ProfessorError } from '../types/professor';
import { api } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const buscarProfessor = async (): Promise<ProfessorResponse> => {
  const token = await AsyncStorage.getItem('authToken');
  console.log('🔑 Token antes da requisição:', token);
  if (!token) {
    throw new Error('Nenhum token encontrado no AsyncStorage');
  }
  try {
    console.log('📤 Enviando GET para /Professor/buscar/...');
    console.log('🌐 URL completa:', api.defaults.baseURL + '/Professor/buscar/');
    const response = await api.get<ProfessorResponse>('/Professor/buscar/');
    console.log('✅ Resposta completa de buscarProfessor:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar professor:', error);
    const axiosError = error as AxiosError<ProfessorError>;
    console.log('📊 Detalhes do erro Axios:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      url: axiosError.config?.url,
      headers: axiosError.config?.headers,
    });
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao buscar dados do professor';
    throw new Error(msg);
  }
};

export const atualizarProfessor = async (professorData: Professor) => {
  let normalizedData: Professor = { ...professorData, escolas: [] }; // Inicialização com valor padrão
  try {
    // Normalizar o campo escolas: se for null ou undefined, usa array vazio; se for array, mantém; senão, converte para array
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
    console.log('📤 Payload normalizado para /Professor/atualizar/:', normalizedData);
    console.log('📤 Enviando PATCH para /Professor/atualizar/ com token do interceptor');
    const response = await api.patch('/Professor/atualizar/', normalizedData);
    console.log('✅ Resposta completa de atualizarProfessor:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar professor:', error);
    const axiosError = error as AxiosError<ProfessorError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao atualizar dados do professor';
    console.log('📊 Detalhes do erro Axios:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      url: axiosError.config?.url,
      requestPayload: JSON.stringify(normalizedData), // Agora seguro devido à inicialização
    });
    throw new Error(msg);
  }
};