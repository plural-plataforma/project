export interface LoginCredentials {
  email: string
  senha: string
}

export interface RegisterCredentials extends LoginCredentials {
  nomeCompleto: string
}

export interface AuthResponse {
  success: boolean
  token: string
}

export interface ApiError {
  message: string
}
