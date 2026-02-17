// src/services/userProfileService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface UpdateProfilePayload {
  idUsuario: number;
  acao?: 'A' | 'I' | string;  
  nome?: string;
  email?: string;
  telefone?: string;
  isEmbaixadora?: boolean;
}

export const updateUserProfile = async (payload: UpdateProfilePayload, token: string) => {
  try {
    const response = await axios.patch(
      `${API_URL}/admin/usuarios/atualizar`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.mensagens?.join('; ') ||
      error.response?.data?.mensagem ||
      'Erro ao atualizar perfil. Tente novamente.'
    );
  }
};