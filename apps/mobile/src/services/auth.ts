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
    await AsyncStorage.setItem('precisaTrocarSenha', precisaTrocarSenha.toString()); // Stringify para bool
  
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
    await AsyncStorage.removeItem('precisaTrocarSenha'); // Limpa flag no logout também
    const remainingToken = await AsyncStorage.getItem('authToken');
    if (remainingToken) {
      console.warn('⚠️ Token ainda presente após signOut');
    }
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
    const success = response.data.success !== false; 
    if (!success) {
      throw new Error('Falha na troca de senha pelo backend');
    }

    let token = response.data.token; 
    if (!token) {
      // Pega o token atual do storage (não precisa renovar sempre)
      token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token atual perdido; faça login novamente');
      }
    } else {
      // Atualiza se novo token veio
      await AsyncStorage.setItem('authToken', token);
    }
    
    // Remove a flag (já que trocou) – Await para garantir sync
    await AsyncStorage.removeItem('precisaTrocarSenha');
    
    return { success: true, token, precisaTrocarSenha: false };
  } catch (error) {
  
    const axiosError = error as AxiosError<any>;
    let msg = 'Falha ao trocar senha'; // Fallback genérico

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      if (status === 400) {
        // Específico para "Incorrect password"
        if (data === 'Incorrect password..' || (typeof data === 'string' && data.includes('password'))) {
          msg = 'Senha atual incorreta. Verifique e tente novamente.';
        }
        // Caso específico: Array de erros de validação
        else if (Array.isArray(data)) {
          const descriptions = data
            .map((item: { code?: string; description?: string }) => {
              if (item.description) {
                return item.description;
              }
              if (item.code) {
                console.warn(`Código de erro não mapeado: ${item.code}`);
                return `Erro de validação: ${item.code}`;
              }
              return null;
            })
            .filter(Boolean);

          if (descriptions.length > 0) {
            msg = descriptions.join('. ') + '.';
          } else {
            msg = 'Erros de validação na senha. Verifique as regras.';
          }
        } else if (typeof data === 'string' || (data && typeof data.message === 'string')) {
          msg = data.message || data as string;
        }
      } else if (status === 401) {
        msg = 'Senha atual inválida. Verifique e tente novamente.';
      } else if (status === 500) {
        msg = 'Erro interno no servidor. Tente novamente mais tarde.';
      } else {
        msg = data?.message || axiosError.message || msg;
      }
    } else {
      msg = axiosError.message || msg;
    }

    console.error(`❌ Detalhes do erro: Status ${axiosError.response?.status}, Mensagem: ${msg}`);
    throw new Error(msg); // Lança com a mensagem formatada
  }
};