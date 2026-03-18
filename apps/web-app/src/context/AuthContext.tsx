import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { api } from '@/api/http'
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth'
import type { AxiosError } from 'axios'

interface AuthContextType {
  isLoggedIn: boolean
  loading: boolean
  userToken: string | null
  precisaTrocarSenha: boolean
  login: (token: string, precisaTrocarSenha: boolean) => void
  trocarSenhaConcluida: () => void
  signOut: () => void
  logoutLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const isSigningOut = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const precisaTrocar = localStorage.getItem('precisaTrocarSenha') === 'true'

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)

      if (payload.exp < now) {
        limparSessao()
      } else {
        setUserToken(token)
        setIsLoggedIn(true)
        setPrecisaTrocarSenha(precisaTrocar)
      }
    } catch {
      limparSessao()
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for 401 events dispatched from axios interceptor
  useEffect(() => {
    const handleLogout = () => limparSessao()
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  function login(token: string, precisaTrocar: boolean) {
    localStorage.setItem('authToken', token)
    localStorage.setItem('precisaTrocarSenha', precisaTrocar.toString())
    setUserToken(token)
    setIsLoggedIn(true)
    setPrecisaTrocarSenha(precisaTrocar)
  }

  function trocarSenhaConcluida() {
    localStorage.removeItem('precisaTrocarSenha')
    setPrecisaTrocarSenha(false)
  }

  async function signOut() {
    if (isSigningOut.current) return
    isSigningOut.current = true
    setLogoutLoading(true)
    try {
      await api.post('Autenticacao/logout').catch(() => undefined)
    } finally {
      limparSessao()
      setLogoutLoading(false)
      isSigningOut.current = false
    }
  }

  function limparSessao() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('precisaTrocarSenha')
    localStorage.removeItem('alert_troca_senha_adiado')
    setUserToken(null)
    setIsLoggedIn(false)
    setPrecisaTrocarSenha(false)
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        loading,
        userToken,
        precisaTrocarSenha,
        login,
        trocarSenhaConcluida,
        signOut,
        logoutLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

// Standalone auth service functions (used in login/register pages)
export async function authLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post('Autenticacao/login', credentials)
  const innerTokenObj = response.data.token
  if (!innerTokenObj?.token) throw new Error('Token não retornado pela API')

  const token: string = innerTokenObj.token
  const precisaTrocarSenha: boolean = innerTokenObj.precisaTrocarSenha ?? false

  localStorage.setItem('authToken', token)
  localStorage.setItem('precisaTrocarSenha', precisaTrocarSenha.toString())

  return { success: true, token, precisaTrocarSenha }
}

export async function authRegister(
  credentials: RegisterCredentials
): Promise<AuthResponse & { message?: string }> {
  const response = await api.post('Autenticacao/registro', credentials)

  let token: string | undefined
  let message: string | undefined

  if (response.status === 200) {
    message =
      typeof response.data === 'string'
        ? response.data
        : response.data.message || 'Usuário criado com sucesso'

    try {
      const loginResult = await authLogin({
        email: credentials.email,
        senha: credentials.senha,
      })
      token = loginResult.token
    } catch {
      // auto-login failed, user will need to login manually
    }
  }

  return { success: true, token, message, precisaTrocarSenha: false }
}

export async function authTrocarSenha(request: {
  senhaAtual: string
  novaSenha: string
}): Promise<AuthResponse> {
  const response = await api.post('Autenticacao/alterarsenha', request)
  const success = response.data.success !== false
  if (!success) throw new Error('Falha na troca de senha pelo backend')

  const token = response.data.token || localStorage.getItem('authToken')
  if (!token) throw new Error('Token perdido; faça login novamente')

  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token)
  }
  localStorage.removeItem('precisaTrocarSenha')

  return { success: true, token, precisaTrocarSenha: false }
}

export async function authAdiarTrocaSenha(): Promise<{ success: boolean }> {
  try {
    const response = await api.post('Autenticacao/adiar-troca-senha')
    if (response.data.success === true) {
      localStorage.removeItem('precisaTrocarSenha')
      return { success: true }
    }
    return { success: false }
  } catch {
    return { success: false }
  }
}

/** Extrai mensagem de erro do Axios ou de erros genéricos. */
function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string; detail?: string; title?: string; errors?: string[] }>
  const data = axiosError.response?.data

  if (data != null) {
    if (typeof data === 'string') return data
    if (data.message) return data.message
    if (data.detail) return data.detail
    if (data.title) return data.title
    if (Array.isArray(data.errors) && data.errors.length > 0) return data.errors[0]
  }

  const msg = axiosError.message || (error instanceof Error ? error.message : null)
  return msg || 'Erro desconhecido'
}

export { getErrorMessage }
