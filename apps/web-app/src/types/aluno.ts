import type { PlanejamentoAluno } from './planejamento'

/** Alinhado ao enum `TipoAtendimentoAee` da API (0–2 disponíveis na UI). */
export type TipoAtendimentoAeeCodigo = 0 | 1 | 2

export const TIPO_ATENDIMENTO_AEE_OPCOES: TipoAtendimentoAeeCodigo[] = [0, 1, 2]

export const TIPO_ATENDIMENTO_AEE_LABELS: Record<TipoAtendimentoAeeCodigo, string> = {
  0: 'Individual',
  1: 'Grupo',
  2: 'Colaborativo',
}

/** Rótulo para valores legados (ex.: Itinerante = 3). */
export function labelTipoAtendimentoAee(codigo: number | null | undefined): string | null {
  if (codigo == null) return null
  if (codigo === 0 || codigo === 1 || codigo === 2) return TIPO_ATENDIMENTO_AEE_LABELS[codigo]
  if (codigo === 3) return 'Itinerante (legado)'
  return null
}

export const DIAS_SEMANA_ATENDIMENTO_OPCOES = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
] as const

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
  tipoAtendimentoAee?: number | null
  perfilPedagogico?: string | null
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
