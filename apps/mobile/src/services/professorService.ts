import axios, { AxiosError } from 'axios';
import { Professor, ProfessorResponse, ProfessorError } from '../types/professor';
import { api } from '../services/auth'; // Reutiliza a instância do axios do auth.ts

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

// ... (buscarProfessor permanece o mesmo)

export const atualizarProfessor = async (professorData: Professor) => {
  try {
    const updatedData = {
      ...professorData,
      escolas: professorData.escolas ? [professorData.escolas] : null, // Converte para array
    };
    const response = await axios.patch('/Professor/atualizar/', updatedData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('userToken') || ''}`, // Ou como está no interceptor
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar professor:', error);
    throw error;
  }
};