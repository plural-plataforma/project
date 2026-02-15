// src/services/authService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

interface RegisterPayload {
  email: string;
  senha: string;
  nomeCompleto: string;
  aceitouTermos: boolean;
  deveAlterarSenha: boolean;
}

export const registerUser = async (payload: RegisterPayload): Promise<void> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  try {
    await axios.post(`${API_URL}/autenticacao/registro`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    if (axios.isAxiosError(error) && error.response?.data) {
      const errData = error.response.data;
      throw new Error(
        errData.mensagem ||
        errData.title ||
        errData.message ||
        'Falha ao cadastrar usuário. Verifique se o e-mail já existe.'
      );
    }
    throw error;
  }
};