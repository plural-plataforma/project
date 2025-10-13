export interface Escola {
  id?: number;
  nomeInstituicao: string;
  tipo?: TipoEscola;
  cep?: string;
  logradouro?: string;
  numero?: number;
  complemento?: string;
  bairro?: string;
  estado: string;
  cidade?: string;
}

export enum TipoEscola {
  Publica = "Pública",
  Privada = "Privada",
  Municipal = "Municipal",
  Estadual = "Estadual",
  Federal = "Federal",
}

export interface EscolasResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Escola;
  listaObjetos: Escola[] | null;
}