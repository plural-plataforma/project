// apps/mobile/src/services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { AxiosError } from 'axios'
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiError
} from '@/apps/mobile/app/types/auth'
import Constants from 'expo-constants'

const API_URL = Constants.expoConfig?.extra?.API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    if (!credentials.email || !credentials.senha) {
      throw new Error('E-mail e senha são obrigatórios')
    }
    const response = await api.post('Autenticacao/login', credentials)
    console.log(response)
    const { token } = response.data
    await AsyncStorage.setItem('authToken', token)
    return { success: true, token }
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>
    throw new Error(axiosError.response?.data.message || 'Falha no login')
  }
}

export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  try {
    if (!credentials.email || !credentials.senha || !credentials.nomeCompleto) {
      throw new Error('E-mail, senha e nome completo são obrigatórios')
    }
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

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem('authToken')
}
