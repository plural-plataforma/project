export interface Habilidade {
  id: number
  idNivelEnsino: number
  tipo: string
  descricao: string
  resumo: string
}

export interface HabilidadeResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Habilidade[]
}
