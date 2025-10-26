import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiError,
  TrocarSenha
} from '../types/auth';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL?.replace(/\/+$/, '') || 'http://localhost:5145/api/';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Single request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const userToken = await AsyncStorage.getItem('authToken');
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    } else {
      console.warn('⚠️ Nenhum token (user) adicionado! API pode falhar.', config.url);
      delete config.headers.Authorization;
    }

    return config;
  },
  error => {
    console.error('❌ Erro no interceptor request:', error);
    return Promise.reject(error);
  }
);

export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    if (!credentials.email || !credentials.senha) {
      const msg = 'E-mail e senha são obrigatórios';
      console.error('❌ Validação falhou:', msg);
      throw new Error(msg);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      throw new Error('E-mail inválido');
    }
    if (credentials.senha.length < 8) {
      throw new Error('Senha deve ter pelo menos 8 caracteres');
    }
    const payload = { email: credentials.email, senha: credentials.senha };
    const response = await api.post('Autenticacao/login', payload);
    const innerTokenObj = response.data.token;
    if (!innerTokenObj || !innerTokenObj.token) {
      throw new Error('Token não retornado pela API (estrutura inválida)');
    }

    const token = innerTokenObj.token;
    const precisaTrocarSenha = innerTokenObj.precisaTrocarSenha ?? false;

    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('trocarSenha', precisaTrocarSenha);
  
    return { success: true, token, precisaTrocarSenha };
  } catch (error) {
    console.error('❌ Erro no login do auth.ts:', error);
    const axiosError = error as AxiosError<ApiError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha no login';
    console.error('📊 Detalhes do erro Axios:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      url: axiosError.config?.url,
      requestPayload: JSON.stringify(credentials)
    });
    throw new Error(msg);
  }
};

export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse & { message?: string }> => {
  let token: string | undefined = undefined;
  let precisaTrocarSenha: boolean = false;
  let autoLogin = false;
  let message: string | undefined;

  try {
    if (!credentials.email || !credentials.senha || !credentials.nomeCompleto) {
      throw new Error('E-mail, senha e nome completo são obrigatórios');
    }
    const response = await api.post('Autenticacao/registro', credentials);

    if (response.status === 200) {
      message = typeof response.data === 'string'
        ? response.data
        : (response.data.message || 'Usuário criado com sucesso');


      try {
        const result = await login({ email: credentials.email, senha: credentials.senha });
        token = result.token;

        if (token) {
          await AsyncStorage.setItem('authToken', token);
          autoLogin = true;
        } else {
          console.error('⚠️ Login OK, mas sem token retornado.');
        }
      } catch (loginError) {
        console.error('❌ Erro no auto-login após registro:', loginError);
        autoLogin = false;
      }
    } else {
      throw new Error(`Status inesperado no registro: ${response.status}`);
    }

    return { success: true, token, autoLogin, message, precisaTrocarSenha };
  } catch (error) {
    console.error('❌ Erro no register:', error);
    const axiosError = error as AxiosError<ApiError>;
    let msg = 'Falha no registro';

    if (axiosError.response?.status === 400) {
      const data = axiosError.response.data;
      if (Array.isArray(data)) {
        msg = data
          .map((err: any) => err.description || err.message || 'Erro desconhecido')
          .join('\n');
      } else {
        msg = (data as any)?.message || msg;
      }
    } else {
      msg = axiosError.response?.data?.message || axiosError.message || msg;
    }

    throw new Error(msg);
  }
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('authToken');
};

export const signOut = async (): Promise<void> => {

  try {
    await AsyncStorage.removeItem('authToken');

    const remainingToken = await AsyncStorage.getItem('authToken');

  } catch (error) {
    console.error('❌ Erro ao limpar o AsyncStorage durante logout:', error);
  }
};

export const trocarSenha = async (request: TrocarSenha): Promise<AuthResponse> => {
  try {
    if (!request.senhaAtual || !request.novaSenha) {
      throw new Error('Senha atual e nova são obrigatórios');
    }
    if (request.novaSenha.length < 8) {
      throw new Error('Nova senha deve ter pelo menos 8 caracteres');
    }
    if (request.senhaAtual === request.novaSenha) {
      throw new Error('Nova senha deve ser diferente da atual');
    }

    const response = await api.post('Autenticacao/alterarsenha', request);
    
    // Assume que backend retorna novo token e confirma sucesso
    const { token } = response.data;
    if (!token) {
      throw new Error('Token não retornado após troca de senha');
    }

    // Atualiza o token no storage
    await AsyncStorage.setItem('authToken', token);
    
    // Remove a flag (já que trocou)
    await AsyncStorage.removeItem('precisaTrocarSenha');
    
    console.log('✅ Senha trocada com sucesso!');
    return { success: true, token, precisaTrocarSenha: false };
  } catch (error) {
    console.error('❌ Erro ao trocar senha:', error);
    const axiosError = error as AxiosError<ApiError>;
    const msg = axiosError.response?.data?.message || axiosError.message || 'Falha ao trocar senha';
    throw new Error(msg);
  }
};
