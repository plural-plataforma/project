export interface Avaliacao {
  id: number
  descricao: string
  resumo: string
}

export interface AvaliacaoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Avaliacao[]
}
