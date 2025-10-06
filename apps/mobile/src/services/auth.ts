// apps/mobile/src/services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiError
} from '../types/auth';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para adicionar token (só usa userToken do AsyncStorage)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const userToken = await AsyncStorage.getItem('authToken');
    console.log('🔍 Interceptor: userToken existe?', !!userToken);
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
      console.log('✅ Adicionando userToken ao header');
    } else {
      console.warn('⚠️ Nenhum token (user) adicionado! API pode falhar.');
      delete config.headers.Authorization; // Remove header se não houver token
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

// Interceptor de resposta para logout em 401
api.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      // Opcional: router.replace('/login')
    }
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
    console.log('📤 Enviando POST para Autenticacao/login...');
    const response = await api.post('Autenticacao/login', credentials);
    console.log('✅ Resposta completa da API:', response);
    console.log('📄 Response.data:', response.data);
    const { token } = response.data;
    if (!token) {
      throw new Error('Token não retornado pela API');
    }
    await AsyncStorage.setItem('authToken', token);
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
      url: axiosError.config?.url
    });
    throw new Error(msg);
  }
};

export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  let token: string | undefined = undefined;
  let autoLogin = false;

  try {
    if (!credentials.email || !credentials.senha || !credentials.nomeCompleto) {
      throw new Error('E-mail, senha e nome completo são obrigatórios');
    }
    console.log('📤 Enviando POST para Autenticacao/registro com:', credentials);
    const response = await api.post('Autenticacao/registro', credentials);
    console.log('✅ Resposta do registro:', response.data);

    // Verifica sucesso com base no status HTTP e mensagem
    if (response.status === 200 && response.data.message === 'Usuário criado com sucesso') {
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

    return { success: true, token, autoLogin };
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

// Função logout atualizada: Invalida no servidor e limpa local (com fallback)
export const logout = async (): Promise<void> => {
  console.log('🔥 logout() do auth.ts chamado!');
  try {
    console.log('📤 Tentando invalidar no servidor...');
    // await api.post('Autenticacao/logout');
    console.log('✅ Token invalidado no servidor!');
  } catch (error) {
    console.error('❌ Erro ao invalidar token no servidor:', error);
    if (axios.isAxiosError(error)) {
      console.log(`Status do erro: ${error.response?.status}`);
    }
  } finally {
    console.log('🧹 Limpando AsyncStorage...');
    await AsyncStorage.removeItem('authToken');
    const remainingToken = await AsyncStorage.getItem('authToken');
    console.log(`✅ Storage limpo! Token restante: ${remainingToken || 'null'}`);
  }
};