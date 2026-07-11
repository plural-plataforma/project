// src/api/authService.ts
import api from './http';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginApiResponse {
  token: {
    token: string;
    precisaTrocarSenha: boolean;
    user: {
      nome: string;
      email: string;
      roles: string[];
    };
  };
}

export interface RegisterPayload {
  email: string;
  senha: string;
  nomeCompleto: string;
  aceitouTermos: boolean;
  deveAlterarSenha: boolean;
  expirationDate?: string;
}

/**
 * Cadastra um novo usuário (professor). Usado pelo fluxo de admin
 * (NewUserDialog) para criar acessos de professores.
 */
export const registerUser = async (payload: RegisterPayload): Promise<void> => {
  try {
    await api.post('/autenticacao/registro', payload);
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    const errData = error?.response?.data;
    throw new Error(
      errData?.mensagem ||
      errData?.title ||
      errData?.message ||
      'Falha ao cadastrar usuário. Verifique se o e-mail já existe.'
    );
  }
};

export const authService = {
  login: async ({ email, password, rememberMe }: LoginCredentials) => {
    const response = await api.post<LoginApiResponse>(
      '/Autenticacao/login',
      { email, senha: password }
    );

    const jwt = response.data.token.token;
    const user = response.data.token.user;

    if (rememberMe) {
      localStorage.setItem('token', jwt);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('token', jwt);
      sessionStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  },

  logout: () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  },

  getUser: () => {
    const user =
      localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!(
      localStorage.getItem('token') || sessionStorage.getItem('token')
    );
  }
};


export default authService;
