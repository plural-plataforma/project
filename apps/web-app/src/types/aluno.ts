import type { PlanejamentoAluno } from './planejamento'

export interface Aluno {
  id?: number
  nomeCompleto: string
  cep?: string
  logradouro?: string
  numero?: number
  complemento?: string
  bairro?: string
  estado: string
  cidade?: string
  responsavel: Responsavel
  sexo?: string
  nivelEnsino?: string
  turno?: string
  ano?: string
  laudos?: Laudo[]
  planejamentos?: PlanejamentoAluno[]
  idEscola?: number
  idProfessor?: number
}

export interface AlunoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Aluno[]
  listaObjetos?: Aluno[]
}

export interface Responsavel {
  nomeCompleto: string
  telefone: string
  email?: string | null
}

export interface Laudo {
  codigoCid: string
  nomeMedico: string
  descricao: string
}
