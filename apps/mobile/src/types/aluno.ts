export interface Aluno {
  id?: number;
  nomeCompleto: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: number;
  complemento?: string;
  bairro?: string;
  estado: string;
  cidade?: string;
  telefone?: string;
  responsavel?: string;
  sexo?: string; // Opcional
  nivelEscolar: number; // Opcional (frontend)
  nivelEnsino?: string; // Opcional (API)
  turno?: string; // Opcional (frontend)
  ano?: string; // Opcional (API)
  cid?: string; // Opcional
  descricaoLaudo?: string; // Opcional
  responsavelMedico?: string; // Opcional
  planoDesenvolvimento?: string; // Opcional
  historicoAtendimento?: string; // Opcional
  observacoesGerais?: string; // Opcional
  idEscola?: number; // Opcional (pode ser 0)
  idProfessor?: number; // Opcional (pode ser 0)
}

export interface AlunoResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Aluno[]; // Para respostas single (ex.: buscarPorId, cadastro)
  listaObjetos?: Aluno[]; // Para listas (ex.: buscarAlunos)
}