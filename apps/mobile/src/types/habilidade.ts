export interface Habilidade {
  id: number
  nivelEnsino: string
  tipo: string
  descricao: string
  resumo: string
}

export interface HabilidadeResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Habilidade[]
}
