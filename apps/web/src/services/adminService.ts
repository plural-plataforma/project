import { api } from '../api/http';
import { Usuario } from '../types/userTypes';

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

/**
 * Busca a lista paginada de usuários (professores/admins).
 * O token é injetado automaticamente pelo interceptor do client `api`.
 */
export const fetchUsuariosAdmin = async (
  params: FetchUsuariosParams
): Promise<PaginatedUsuarios> => {
  try {
    const response = await api.get('/admin/usuarios/listar', { params });

    // Possíveis estruturas comuns do backend:
    let result: PaginatedUsuarios;

    if (response.data?.objeto) {
      // Caso comum: { sucesso: true, objeto: { itens: [], ... } }
      result = response.data.objeto;
    } else if (response.data?.itens) {
      // Caso direto: { itens: [], paginaAtual: 1, ... }
      result = response.data;
    } else if (response.data?.data?.itens) {
      // Algumas APIs aninhadas
      result = response.data.data;
    } else {
      console.warn('[fetchUsuariosAdmin] Formato inesperado da resposta');
      throw new Error('Formato de resposta da API inválido');
    }

    return {
      itens: result.itens || [],
      paginaAtual: result.paginaAtual || 1,
      tamanhoPagina: result.tamanhoPagina || result.itens?.length || 0,
      totalItens: result.totalItens || result.itens?.length || 0,
      totalPaginas: result.totalPaginas || 1,
    };
  } catch (error: any) {
    console.error('[fetchUsuariosAdmin] Erro completo:', error);

    const mensagemErro =
      error.response?.data?.detalhe ||
      error.response?.data?.erro ||
      error.response?.data?.message ||
      error.message ||
      'Erro desconhecido ao carregar usuários';

    throw new Error(mensagemErro);
  }
};
