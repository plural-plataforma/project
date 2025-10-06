import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { getToken, logout } from '../services/auth' // Ajuste path
import { router } from 'expo-router' // Para redirecionamentos

interface AuthContextType {
  isLoggedIn: boolean
  loading: boolean
  userToken: string | null
  login: (token: string) => void
  signOut: () => Promise<void> // Mude para async Promise para suportar loading
  logoutLoading: boolean // Novo: para UX no botão
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false) // Novo estado

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken()
        if (token) {
          // Opcional: Valide token no backend (ex: chame uma API /me para checar validade)
          setUserToken(token)
          setIsLoggedIn(true)
          // Só navega para dashboard se houver token (auto-login)
          router.replace('/dashboard')
        } else {
          // Não navega automaticamente para login; deixa o app iniciar na landing (index.tsx)
          // O redirecionamento para login só acontece em rotas protegidas (ex: dashboard useEffect)
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error('Erro ao verificar auth:', error)
        setIsLoggedIn(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (token: string) => {
    console.log(
      '🔑 Context.login chamado com token:',
      token ? 'existe' : 'null/undefined'
    ) // Verifica token recebido
    if (!token) {
      console.warn('⚠️ Token vazio no context.login — login falhará!')
      return
    }
    setUserToken(token)
    setIsLoggedIn(true)
    console.log('✅ Estados setados: isLoggedIn=true, userToken atualizado') // Confirma mudança
    // Salva no storage (assumindo que authLogin/register já faz isso, senão chame saveToken aqui)
  }

  const signOut = async (): Promise<void> => {
    console.log('🔥 signOut chamado no AuthContext!') // Log inicial
    setLogoutLoading(true)
    try {
      console.log('📤 Chamando logout() do serviço...') // Antes da chamada
      await logout() // Limpa storage
      console.log('✅ logout() do serviço concluído!') // Se chegou aqui, limpou local
      setUserToken(null)
      setIsLoggedIn(false)
      console.log('🔄 Estados atualizados: isLoggedIn=false, userToken=null') // Confirma estados
      console.log('➡️ Redirecionando para /auth/login...') // Antes do replace
      router.replace('/auth/login')
      console.log('🎉 Redirecionamento executado!') // Se chegou aqui, router funcionou
    } catch (error) {
      console.error('❌ Erro no signOut:', error) // Captura qualquer erro
      // Mesmo em erro, limpa localmente
      setUserToken(null)
      setIsLoggedIn(false)
      router.replace('/auth/login')
    } finally {
      setLogoutLoading(false)
    }
  }

  const value = {
    isLoggedIn,
    loading,
    userToken,
    login,
    signOut,
    logoutLoading
  }

  // Sempre renderiza o Provider, mesmo durante loading (rotas públicas como landing renderizam normalmente)
  // Rotas protegidas (ex: dashboard) lidam com loading via seu próprio useEffect/return null
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
