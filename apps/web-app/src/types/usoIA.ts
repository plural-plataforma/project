/** Alinhado a `LimiteUsoIADTO` da API (conta só gerações com sucesso, horário de Brasília). */
export interface LimiteUsoIA {
  usoHoje: number
  limiteDiario: number
  limiteDiarioAtingido: boolean
  usoMes: number
  limiteMensal: number
  limiteMensalAtingido: boolean
}

export interface LimiteUsoIAResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: LimiteUsoIA | null
}
