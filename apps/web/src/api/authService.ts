import api from './http';
import { AxiosResponse } from 'axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    role?: string;
  };
  expiresIn?: number;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/api/auth/login', credentials);
    const { token } = response.data;

    // Salva o token (escolha um dos dois, ou use ambos com lógica)
    localStorage.setItem('token', token);
    // sessionStorage.setItem('token', token); // se quiser sessão por aba

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    // Se usar refresh token em cookie HttpOnly → backend limpa
    // window.location.href = '/login';
  },

  isAuthenticated: (): boolean => {
    return !! (localStorage.getItem('token') || sessionStorage.getItem('token'));
  },

  getToken: (): string | null => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  // Exemplo futuro: refresh token
  // refreshToken: async () => { ... },

  // getCurrentUser: async () => { ... }
};

export default authService;