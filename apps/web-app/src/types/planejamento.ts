import type { Aluno } from './aluno'
import type { Avaliacao } from './avaliacao'
import type { Estrategia } from './estrategia'
import type { Habilidade } from './habilidade'

/** Linha persistida pela API (.NET DateOnly vira yyyy-MM-dd). */
export interface PaeeEncontro {
  id: number
  dataEnc: string
  textoPlanejado?: string | null
  textoRealizado?: string | null
  habilidadeId?: number | null
  estrategiaId?: number | null
}

export interface PaeeEncontroEntrada {
  dataEnc: string
  textoPlanejado?: string | null
  textoRealizado?: string | null
  habilidadeId?: number | null
  estrategiaId?: number | null
}

export interface PaeeSugestaoDatas {
  datas: string[]
}

export interface PaeeObjetivoCatalogo {
  id: number
  codigo: string
  rotulo: string
  textoModelo: string
  prazo: 'Curto' | 'Medio' | 'Longo' | string
  ordemExibicao: number
}

export interface Planejamento {
  id: number
  apelido: string
  dataInicio: string
  dataFim: string
  descicaoPlanejamento: string
  objetivoCurtoPrazo?: string | null
  objetivoMedioPrazo?: string | null
  objetivoLongoPrazo?: string | null
  objetivoCurtoCatalogoId?: number | null
  objetivoMedioCatalogoId?: number | null
  objetivoLongoCatalogoId?: number | null
  documentoDeclaradoAssinado?: boolean
  assinaturaNomeResponsavel?: string | null
  assinaturaCargo?: string | null
  encontros?: PaeeEncontro[]
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
