export interface TermoPendente {
  termoVersaoId: number
  chave: string
  nome: string
  versao: number
  texto: string
}

export interface TermoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: TermoPendente | null
  listaObjetos: TermoPendente[]
}
