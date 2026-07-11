export interface Habilidade {
  id: number
  idNivelEnsino?: number
  tipo?: string
  descricao?: string
  resumo?: string
  ativo?: boolean
}

export interface HabilidadeResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Habilidade[]
}
