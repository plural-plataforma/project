export interface Escola {
  id: number
  nomeInstituicao: string
  tipo?: TipoEscola
  cep?: string
  logradouro?: string
  numero?: number
  complemento?: string
  bairro?: string
  estado: string
  cidade?: string
}

export const TipoEscola = {
  Publica: 'Pública',
  Privada: 'Privada',
  Municipal: 'Municipal',
  Estadual: 'Estadual',
  Federal: 'Federal',
} as const

export type TipoEscola = (typeof TipoEscola)[keyof typeof TipoEscola]

export interface EscolasResponse {
  sucesso: boolean
  mensagens: string[]
  listaObjetos: Escola[] | null
  objeto: Escola[] | null
}
