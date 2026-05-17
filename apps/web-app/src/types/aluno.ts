import type { PlanejamentoAluno } from './planejamento'

/** Alinhado ao enum `TipoAtendimentoAee` da API (0–3). */
export type TipoAtendimentoAeeCodigo = 0 | 1 | 2 | 3

export const TIPO_ATENDIMENTO_AEE_LABELS: Record<TipoAtendimentoAeeCodigo, string> = {
  0: 'Individual',
  1: 'Grupo',
  2: 'Colaborativo',
  3: 'Itinerante',
}

export interface Aluno {
  id?: number
  nomeCompleto: string
  /** ISO yyyy-mm-dd */
  dataNascimento?: string | null
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
  frequenciaSemanalAtendimento?: number | null
  diasSemanaAtendimento?: string[]
  duracaoAtendimentoMinutos?: number | null
  tipoAtendimentoAee?: TipoAtendimentoAeeCodigo | null
  perfilPedagogicoPotencialidades?: string | null
  perfilPedagogicoNecessidades?: string | null
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
