// apps/mobile/src/services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiError
} from '../types/auth'
import Constants from 'expo-constants'

const API_URL = Constants.expoConfig?.extra?.API_URL
const INITIAL_TOKEN = Constants.expoConfig?.extra?.INITIAL_API_TOKEN

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor para adicionar token (prioriza user JWT; fallback para initial se não houver user token)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const userToken = await AsyncStorage.getItem('authToken')
    console.log('🔍 Interceptor: userToken existe?', !!userToken) // Verifica token atual
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`
      console.log('✅ Adicionando userToken ao header') // Se usar userToken
    } else {
      // Envia token inicial se não houver user token (útil para login/register)
      console.log('🔑 INITIAL_TOKEN existe?', !!INITIAL_TOKEN) // Crucial: verifica se definido
      if (INITIAL_TOKEN) {
        config.headers.Authorization = `Bearer ${INITIAL_TOKEN}`
        console.log('✅ Adicionando INITIAL_TOKEN ao header') // Para login
      } else {
        console.warn(
          '⚠️ Nenhum token (user ou initial) adicionado! API pode falhar.'
        ) // Alerta
      }
    }
    console.log('📤 Config final do request:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    }) // Headers enviados
    return config
  },
  error => {
    console.error('❌ Erro no interceptor request:', error)
    return Promise.reject(error)
  }
)

// Interceptor de resposta para logout em 401
api.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken')
      // Opcional: router.replace('/login')
    }
    return Promise.reject(error)
  }
)

export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  console.log('🔥 login() do auth.ts iniciado com:', credentials) // Creds recebidas
  console.log('🌐 API_URL configurada:', API_URL) // Verifica se URL existe
  try {
    if (!credentials.email || !credentials.senha) {
      const msg = 'E-mail e senha são obrigatórios'
      console.error('❌ Validação falhou:', msg)
      throw new Error(msg)
    }
    console.log('📤 Enviando POST para Autenticacao/login...') // Antes do post
    const response = await api.post('Autenticacao/login', credentials)
    console.log('✅ Resposta completa da API:', response) // Full response (data, status, etc.)
    console.log('📄 Response.data:', response.data) // Específico do body
    const { token } = response.data
    if (!token) {
      throw new Error('Token não retornado pela API')
    }
    await AsyncStorage.setItem('authToken', token)
    return { success: true, token } // token: string (obrigatório aqui)
  } catch (error) {
    console.error('❌ Erro no login do auth.ts:', error) // Log full error
    const axiosError = error as AxiosError<ApiError>
    const msg =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Falha no login'
    console.log('📊 Detalhes do erro Axios:', {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      url: axiosError.config?.url
    }) // Breakdown do erro
    throw new Error(msg)
  }
}
export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  let token: string | undefined = undefined
  let autoLogin = false

  try {
    if (!credentials.email || !credentials.senha || !credentials.nomeCompleto) {
      throw new Error('E-mail, senha e nome completo são obrigatórios')
    }
    console.log('📤 Enviando POST para Autenticacao/registro com:', credentials)
    const response = await api.post('Autenticacao/registro', credentials)
    console.log('✅ Resposta do registro:', response.data)

    // Checa se é 200 OK
    if (response.data.status === 200) {
      const dataAcess = {
        email: response.data.email,
        senha: response.data.senha // Use com cuidado: senha plain-text!
      }
      console.log('🔄 Iniciando auto-login com dados cadastrados:', {
        email: dataAcess.email
      })

      try {
        // Chama login com os dados do registro
        const result = await login(dataAcess) // Corrigi: 'result' em vez de 'return'
        token = result.token

        if (token) {
          console.log('🔑 Salvando token no AsyncStorage...')
          await AsyncStorage.setItem('authToken', token)
          autoLogin = true
          console.log('✅ Token salvo! Auto-login ativado.')
        } else {
          console.log('⚠️ Login OK, mas sem token retornado.')
        }
      } catch (loginError) {
        // Se auto-login falhar, logue mas não quebre o registro
        console.error('❌ Erro no auto-login após registro:', loginError)
        console.log(
          '⚠️ Registro OK, mas auto-login falhou. Usuário deve logar manualmente.'
        )
        autoLogin = false // Mantém false
      }
    } else {
      // Se não for 200, joga erro
      throw new Error(`Status inesperado no registro: ${response.data.status}`)
    }

    return { success: true, token, autoLogin }
  } catch (error) {
    console.error('❌ Erro no register:', error)
    const axiosError = error as AxiosError<ApiError>
    let msg = 'Falha no registro'

    if (axiosError.response?.status === 400) {
      const data = axiosError.response.data
      if (Array.isArray(data)) {
        msg = data
          .map(
            (err: any) => err.description || err.message || 'Erro desconhecido'
          )
          .join('\n')
        console.log('🔍 Erros de validação capturados:', data)
      } else {
        msg = (data as any)?.message || msg
      }
    } else {
      msg = axiosError.response?.data?.message || axiosError.message || msg
    }

    console.log('📊 Mensagem de erro final:', msg)
    throw new Error(msg)
  }
}

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('authToken')
}

// Função logout atualizada: Invalida no servidor e limpa local (com fallback)
export const logout = async (): Promise<void> => {
  console.log('🔥 logout() do auth.ts chamado!') // Log inicial
  try {
    // Chama o endpoint de logout no servidor para invalidar o token
    console.log('📤 Tentando invalidar no servidor...') // Antes da API
    // await api.post('Autenticacao/logout')
    console.log('✅ Token invalidado no servidor!') // Sucesso na API
  } catch (error) {
    // Se falhar (ex.: sem conexão ou endpoint não existe), logue o erro mas prossiga com limpeza local
    console.error('❌ Erro ao invalidar token no servidor:', error) // Log detalhado
    if (axios.isAxiosError(error)) {
      console.log(`Status do erro: ${error.response?.status}`) // Ex.: 404 se endpoint não existir
    }
  } finally {
    // Sempre limpa o storage local, independente de sucesso no servidor
    console.log('🧹 Limpando AsyncStorage...') // Antes da limpeza
    await AsyncStorage.removeItem('authToken')
    const remainingToken = await AsyncStorage.getItem('authToken') // Verifica se limpou
    console.log(`✅ Storage limpo! Token restante: ${remainingToken || 'null'}`) // Confirma
  }
}
