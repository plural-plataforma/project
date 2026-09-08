// Centraliza a leitura/escrita do token de sessão no localStorage.

const TOKEN_KEY = 'authToken'
const PRECISA_TROCAR_KEY = 'precisaTrocarSenha'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getPrecisaTrocarSenha(): boolean {
  return localStorage.getItem(PRECISA_TROCAR_KEY) === 'true'
}

export function setAuthSession(token: string, precisaTrocarSenha: boolean): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(PRECISA_TROCAR_KEY, precisaTrocarSenha.toString())
}

export function updateAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearPrecisaTrocarSenha(): void {
  localStorage.removeItem(PRECISA_TROCAR_KEY)
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PRECISA_TROCAR_KEY)
  localStorage.removeItem('alert_troca_senha_adiado')
}
