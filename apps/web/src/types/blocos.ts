export interface Bloco {
  id: number;
  titulo: string;
  ordem: number;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
  status: boolean;
  icone: string | null;
  // se futuramente a API retornar:
  atividades?: number;
}

export interface BlocoCreateInput {
  titulo: string;
  ordem: number;
  observacao?: string | null;
  status: boolean;
  icone?: string | null;
}

export interface BlocosResponse {
  total: number;
  blocos: Bloco[];
}

export interface BlocosQueryParams {
  busca?: string;
  ativo?: boolean;
  page: number;
  pageSize: number;
}