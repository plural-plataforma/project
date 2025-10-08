export interface LoginCredentials {
  email: string
  senha: string
}

export interface RegisterCredentials extends LoginCredentials {
  nomeCompleto: string
  isCheckTerms: boolean
}

export interface AuthResponse {
  success: boolean
  token?: string
  autoLogin?: boolean
}

export interface ApiError {
  message: string
}
