import axios, { AxiosError } from 'axios';
import { Professor, ProfessorResponse, ProfessorError } from '../types/professor';
import { api } from '../services/auth';

export const buscarProfessor = async (): Promise<ProfessorResponse> => {
  try {
    console.log('📤 Enviando GET para /Professor/buscar/...');
    const response = await api.get<ProfessorResponse>('/Professor/buscar/');
    console.log('✅ Resposta completa de buscarProfessor:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar professor:', error);
    const axiosError = error as AxiosError<ProfessorError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao buscar dados do professor';
    console.log('📊 Detalhes do erro Axios:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      url: axiosError.config?.url,
    });
    throw new Error(msg);
  }
};

export const atualizarProfessor = async (professorData: Professor) => {
  try {
    const updatedData = {
      ...professorData,
      escolas: professorData.escolas ? [professorData.escolas] : null,
    };
    console.log('📤 Enviando PUT para /Professor/atualizar/ com token do interceptor', updatedData);
    const response = await api.put('/Professor/atualizar/', updatedData);
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
    });
    throw new Error(msg);
  }
};