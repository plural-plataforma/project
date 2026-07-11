// src/services/userProfileService.ts
import { api } from '../api/http';

interface UpdateProfilePayload {
  idUsuario:       number
  acao?:            'A' | 'I' | string;
  nome?:           string;
  email?:          string;
  telefone?:       string;
  isActive:        boolean;
  isEmbaixadora?:  boolean;
  expirationDate?: string | null;
  rolesAdicionar?: string[];
  rolesRemover?:   string[];
}

/**
 * Atualiza o perfil de um usuário administrado.
 * O token é injetado automaticamente pelo interceptor do client `api`.
 */
export const updateUserProfile = async (payload: UpdateProfilePayload) => {
  try {
    const response = await api.patch('/admin/usuarios/atualizar', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.mensagens?.join('; ') ||
      error.response?.data?.mensagem ||
      'Erro ao atualizar perfil. Tente novamente.'
    );
  }
};
