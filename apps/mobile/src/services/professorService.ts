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
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ProfessorError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha ao vincular escola';
    throw new Error(msg);
  }
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

    // Vincular escolas usando o novo endpoint
    let schoolLinkErrors: string[] = [];
    for (const escolaId of normalizedData.escolas) {
      const idEscola = parseInt(escolaId, 10);
      if (!isNaN(idEscola)) {
        try {
          await vincularEscola(idEscola);
        } catch (schoolError: any) {
          console.warn(`⚠️ Falha ao vincular escola ID ${idEscola}: ${schoolError.message}`);
          schoolLinkErrors.push(`Escola ID ${idEscola}: ${schoolError.message}`);
        }
      } else {
        console.warn(`⚠️ ID de escola inválido: ${escolaId}`);
        schoolLinkErrors.push(`ID de escola inválido: ${escolaId}`);
      }
    }

    if (schoolLinkErrors.length > 0) {
      console.warn('⚠️ Algumas escolas não foram vinculadas:', schoolLinkErrors);
      throw new Error(`Cadastro atualizado, mas erro ao vincular escolas: ${schoolLinkErrors.join('; ')}`);
    }

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