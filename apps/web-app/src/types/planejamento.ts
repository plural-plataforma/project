import type { Aluno } from './aluno'
import type { Avaliacao } from './avaliacao'
import type { Estrategia } from './estrategia'
import type { Habilidade } from './habilidade'

export interface Planejamento {
  id: number
  apelido: string
  dataInicio: string
  dataFim: string
  descicaoPlanejamento: string
  habilidades?: Habilidade[]
  estrategias?: Estrategia[]
  avaliacao?: Avaliacao[]
  alunos?: Aluno[]
}

export interface PlanejamentoAluno {
  id: number
  apelido: string
  dataInicio: string
  dataFim: string
  descicaoPlanejamento: string
  habilidades: Habilidade[]
  estrategias: Estrategia[]
  avaliacao: Avaliacao[]
}

export interface PlanejamentoVinculaAluno {
  idPlanejamento: number
  idAluno: number
}

export interface PlanejamentoVinculaHabilidade {
  idPlanejamento: number
  idHabilidade: number
}

export interface PlanejamentoVinculaEstrategia {
  idPlanejamento: number
  idEstrategia: number
}

export interface PlanejamentoVinculaAvaliacao {
  idPlanejamento: number
  idAvaliacao: number
}

export interface PlanejamentoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Planejamento | null
  listaObjetos: Planejamento[]
}
