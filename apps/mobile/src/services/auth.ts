import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiError
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
    console.log('🔍 Interceptor: userToken existe?', !!userToken);
    console.log('🔑 Token completo:', userToken);
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
      console.log('✅ Adicionando userToken ao header:', config.url);
    } else {
      console.warn('⚠️ Nenhum token (user) adicionado! API pode falhar.', config.url);
      delete config.headers.Authorization;
    }
    console.log('📤 Config final do request:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
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
  console.log('🔥 login() do auth.ts iniciado com:', credentials);
  console.log('🌐 API_URL configurada:', API_URL);
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
    console.log('📤 Enviando POST para Autenticacao/login com payload:', JSON.stringify(payload));
    const response = await api.post('Autenticacao/login', payload);
    console.log('✅ Resposta completa da API:', response.data);
    const { token } = response.data;
    if (!token) {
      throw new Error('Token não retornado pela API');
    }
    console.log('🔐 Tentando salvar token no AsyncStorage:', token);
    await AsyncStorage.setItem('authToken', token);
    const savedToken = await AsyncStorage.getItem('authToken');
    console.log('🔑 Token salvo no AsyncStorage:', savedToken);
    if (savedToken !== token) {
      console.error('⚠️ Token salvo difere do retornado:', { savedToken, token });
    } else {
      console.log('✅ Token salvo com sucesso!');
    }
    return { success: true, token };
  } catch (error) {
    console.error('❌ Erro no login do auth.ts:', error);
    const axiosError = error as AxiosError<ApiError>;
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha no login';
    console.log('📊 Detalhes do erro Axios:', {
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
  let autoLogin = false;
  let message: string | undefined;

  try {
    if (!credentials.email || !credentials.senha || !credentials.nomeCompleto) {
      throw new Error('E-mail, senha e nome completo são obrigatórios');
    }
    console.log('📤 Enviando POST para Autenticacao/registro com:', credentials);
    const response = await api.post('Autenticacao/registro', credentials);
    console.log('✅ Resposta bruta do registro:', response.data);

    if (response.status === 200) {
      message = typeof response.data === 'string'
        ? response.data
        : (response.data.message || 'Usuário criado com sucesso');
      console.log('🔍 Mensagem extraída da resposta:', message);

      console.log('🔄 Iniciando auto-login com dados cadastrados:', {
        email: credentials.email
      });

      try {
        const result = await login({ email: credentials.email, senha: credentials.senha });
        token = result.token;

        if (token) {
          console.log('🔑 Salvando token no AsyncStorage...');
          await AsyncStorage.setItem('authToken', token);
          autoLogin = true;
          console.log('✅ Token salvo! Auto-login ativado.');
        } else {
          console.log('⚠️ Login OK, mas sem token retornado.');
        }
      } catch (loginError) {
        console.error('❌ Erro no auto-login após registro:', loginError);
        console.log('⚠️ Registro OK, mas auto-login falhou. Usuário deve logar manualmente.');
        autoLogin = false;
      }
    } else {
      throw new Error(`Status inesperado no registro: ${response.status}`);
    }

    return { success: true, token, autoLogin, message };
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
        console.log('🔍 Erros de validação capturados:', data);
      } else {
        msg = (data as any)?.message || msg;
      }
    } else {
      msg = axiosError.response?.data?.message || axiosError.message || msg;
    }

    console.log('📊 Mensagem de erro final:', msg);
    throw new Error(msg);
  }
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('authToken');
};

export const signOut = async (): Promise<void> => {
  console.log('🔥 signOut() do auth.ts chamado!');

  try {
    console.log('🧹 Limpando AsyncStorage...');
    await AsyncStorage.removeItem('authToken');

    const remainingToken = await AsyncStorage.getItem('authToken');
    console.log(`✅ Storage limpo! Token restante: ${remainingToken || 'null'}`);
  } catch (error) {
    console.error('❌ Erro ao limpar o AsyncStorage durante logout:', error);
  }
};
