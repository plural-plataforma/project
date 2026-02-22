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

    // Possíveis estruturas comuns do seu backend:
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

    // Garantia mínima: sempre retorna algo válido
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