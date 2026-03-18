export interface Estrategia {
  id: number
  descricao: string
}

export interface EstrategiaResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Estrategia[]
}
