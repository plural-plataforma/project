export interface Professor {
  nomeCompleto: string;
  email?: string;
  cep?: string ;
  logradouro?: string;
  numero: number ;
  complemento: string;
  bairro: string;
  estado: string;
  cidade: string;
  telefone: string;
  disciplinas: string;
  nivelEnsino: string;
  sobre: string;
  aceitouTermos: boolean;
  isCheckTerms: boolean;

  escolas: string[];
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