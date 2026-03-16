export interface Avaliacao {
  id: number
  descricao: string
  resumo: string
  ativo?: boolean
}

export interface AvaliacaoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto?: Avaliacao | Avaliacao[] | null
  listaObjetos?: Avaliacao[]
}

export interface AvaliacaoPayload {
  descricao: string
  resumo: string
  ativo?: boolean
}
