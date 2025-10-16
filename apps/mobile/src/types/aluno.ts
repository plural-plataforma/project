export interface Aluno {
  nomeCompleto: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: number;
  complemento: string;
  bairro: string;
  estado: string;
  cidade: string;
  telefone: string;
  responsavel: string;
  sexo?: string; // Opcional
  nivelEscolar?: number; // Opcional
  turno?: number; // Opcional
  cid?: string; // Opcional
  descricaoLaudo?: string; // Opcional
  responsavelMedico?: string; // Opcional
  planoDesenvolvimento?: string; // Opcional
  historicoAtendimento?: string; // Opcional
  observacoesGerais?: string; // Opcional
  escolas: number; // Opcional
  idProfessor: number; // Opcional
}

export interface AlunoResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Aluno;
  listaObjetos: Aluno[] | null;
}