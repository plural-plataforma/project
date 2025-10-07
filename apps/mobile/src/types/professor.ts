export interface Professor {
  nomeCompleto: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  estado: string | null;
  cidade: string | null;
  telefone: string | null;
  disciplinas: string | null;
  nivelEnsino: string | null;
  sobre: string | null;
  isCheckTerms: boolean | null;
  escolas?: string[] | null;
}

export interface ProfessorResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Professor;
  listaObjetos: Professor[] | null;
}

// Nova interface para o tipo de erro da resposta
export interface ProfessorError {
  message?: string; // Propriedade message opcional
  [key: string]: any; // Permite propriedades adicionais dinâmicas
}