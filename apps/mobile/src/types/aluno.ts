export interface Aluno {
  id?: number;
  nomeCompleto: string;
  cep?: string;
  logradouro?: string;
  numero?: number;
  complemento?: string;
  bairro?: string;
  estado: string;
  cidade?: string;
  responsavel: Responsavel;
  sexo?: string; 
  nivelEnsino?: string;
  turno?: string;
  ano?: string;
  laudos?: Laudo[];
  idEscola?: number; // Opcional (pode ser 0)
  idProfessor?: number; // Opcional (pode ser 0)
}

export interface AlunoResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Aluno[]; // Para respostas single (ex.: buscarPorId, cadastro)
  listaObjetos?: Aluno[]; // Para listas (ex.: buscarAlunos)
}

export interface Responsavel{
  nomeCompleto: string;
  telefone: string;
  email: string;
 }
export interface Laudo{
  codigoCid: string;
  nomeMedico: string;
  descricao: string;
 }