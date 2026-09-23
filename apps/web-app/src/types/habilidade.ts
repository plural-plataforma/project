export interface Habilidade {
  id: number
  idNivelEnsino?: number
  tipo?: string
  descricao?: string
  resumo?: string
  ativo?: boolean
  ehPropria?: boolean
}

export interface HabilidadeResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Habilidade[]
}

export interface HabilidadeUnicaResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Habilidade | null
}

export interface HabilidadeCadastroPayload {
  idNivelEnsino: number
  tipo: string
  descricao: string
  resumo?: string
}

export interface HabilidadeAtualizarPayload {
  id: number
  idNivelEnsino?: number
  tipo?: string
  descricao?: string
  resumo?: string
  ativo?: boolean
}
