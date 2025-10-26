export interface LoginCredentials {
  email: string
  senha: string
}

export interface RegisterCredentials extends LoginCredentials {
  nomeCompleto: string
  aceitouTermos: boolean
}

export interface AuthResponse {
  success: boolean
  token?: string
  autoLogin?: boolean
  precisaTrocarSenha?:boolean
}

export interface ApiError {
  message: string
}

export interface TrocarSenha {
  senhaAtual: string;
  novaSenha: string;
}