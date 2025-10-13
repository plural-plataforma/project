export interface Professor {
  nomeCompleto: string;
  sexo: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero: number;
  complemento?: string;
  bairro?: string;
  estado?: string;
  cidade?: string;
  telefone?: string;
  disciplinas?: string;
  nivelEnsino?: string;
  sobre?: string;
  aceitouTermos: boolean;
  escolas: string[] | never;
}

export interface ProfessorResponse {
  objeto: Professor;
  mensagens: string[];
  sucesso: boolean;
  listaObjetos?: any;
}

export interface ProfessorError {
  message: string;
}