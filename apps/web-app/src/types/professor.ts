export interface Professor {
  nomeCompleto: string
  sexo: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: number
  complemento?: string
  bairro?: string
  estado?: string
  cidade?: string
  telefone?: string
  disciplinas?: string
  nivelEnsino?: string
  sobre?: string
  aceitouTermos: boolean
  escolas?: string[]
}

export interface ProfessorResponse {
  objeto: Professor
  mensagens: string[]
  sucesso: boolean
  listaObjetos?: unknown
}

export interface ProfessorError {
  message: string
}
