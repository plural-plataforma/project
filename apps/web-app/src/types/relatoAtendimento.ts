export type RelatoTipoOcorrencia = 0 | 1 | 2

/** Resposta típica da API com lista. */
export interface RelatoListaResponse {
  sucesso: boolean
  mensagens: string[]
  listaObjetos?: RelatoAtendimento[]
  objeto?: unknown
}

export interface RelatoAtendimento {
  id: number
  alunoId: number
  alunoNome: string
  planejamentoId?: number | null
  planejamentoApelido?: string | null
  dataSessao: string
  presencaPresente: boolean
  tipoOcorrencia: RelatoTipoOcorrencia
  habilidadeId?: number | null
  habilidadeResumo?: string | null
  estrategiaId?: number | null
  estrategiaDescricao?: string | null
  observacoes?: string | null
  avancos: string[]
  dificuldades: string[]
  textoGeradoIA?: string | null
}

export interface RelatoSugestoesMesResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: {
    ano: number
    mes: number
    datasSugeridas: string[]
    datasComRelatoRegistrado: string[]
  } | null
}

export interface RelatoCadastroPayload {
  alunoId: number
  planejamentoId?: number | null
  dataSessao: string
  presencaPresente: boolean
  tipoOcorrencia: RelatoTipoOcorrencia
  habilidadeId?: number | null
  estrategiaId?: number | null
  observacoes?: string | null
  avancos: string[]
  dificuldades: string[]
}

export interface RelatoAtualizarPayload extends RelatoCadastroPayload {
  id: number
}
