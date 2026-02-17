import axios from 'axios';
import { Usuario } from '../types/userTypes';

const API_URL = import.meta.env.VITE_API_URL;

interface FetchUsuariosParams {
  pagina?: number;
  tamanhoPagina?: number;
  ativo?: boolean | null;
  isEmbaixadora?: boolean | null;
  search?: string;
  nivelEnsino?: string;
}

export interface PaginatedUsuarios {
  itens: Usuario[];
  paginaAtual: number;
  tamanhoPagina: number;
  totalItens: number;
  totalPaginas: number;
}


export const fetchUsuariosAdmin = async (
  params: FetchUsuariosParams,
  token: string
): Promise<PaginatedUsuarios> => {
  try {
    const response = await axios.get(`${API_URL}/admin/usuarios/listar`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Ajuste conforme o formato exato da resposta do seu backend
    // Se o backend retornar { sucesso: true, objeto: { ... } }, use response.data.objeto
    return response.data.objeto || response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detalhe ||
      error.response?.data?.erro ||
      'Erro ao carregar lista de professores. Verifique sua conexão ou permissões.'
    );
  }
};