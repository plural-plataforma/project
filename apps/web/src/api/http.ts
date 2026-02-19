// src/api/http.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7222';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // opcional: evita travamentos longos
});

// Interceptor de REQUEST → injeta token dinamicamente
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPONSE → tratamento global de erros (ex: 401 → logout)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Aqui você pode tentar refresh token (se implementar)
        // const newToken = await authService.refreshToken();
        // localStorage.setItem('token', newToken);
        // originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // return api(originalRequest);

        console.warn('Sessão expirada. Redirecionando para login...');
        // authService.logout(); // limpa storage e redireciona
        // ou: window.location.href = '/login?session_expired=true';
      } catch (refreshError) {
        console.error('Falha ao renovar token:', refreshError);
        // authService.logout();
      }
    }

    console.error('Erro na API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;