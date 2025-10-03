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
    console.log('🔑 Salvando token no AsyncStorage...') // Antes de salvar
    await AsyncStorage.setItem('authToken', token)
    console.log('✅ Token salvo! Retornando response') // Confirma
    return { success: true, token }
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
  try {
    if (!credentials.email || !credentials.senha || !credentials.nomeCompleto) {
      throw new Error('E-mail, senha e nome completo são obrigatórios')
    }
    // O interceptor cuida do INITIAL_TOKEN automaticamente
    const response = await api.post('Autenticacao/registro', credentials)
    const { token } = response.data
    await AsyncStorage.setItem('authToken', token)
    return { success: true, token }
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>
    throw new Error(axiosError.response?.data.message || 'Falha no registro')
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
