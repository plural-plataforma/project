import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
const API_BASE_URL = rawApiUrl?.replace(/\/+$/, '') ?? ''

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL não está definida. Configure a variável de ambiente para o web-app.')
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

const ENABLE_HTTP_DEBUG = import.meta.env.DEV

const getRequestUrl = (config: InternalAxiosRequestConfig): string => {
  const base = (config.baseURL ?? '').replace(/\/+$/, '')
  const path = `/${(config.url ?? '').replace(/^\/+/, '')}`
  return `${base}${path}`
}

const logRequest = (config: InternalAxiosRequestConfig): void => {
  if (!ENABLE_HTTP_DEBUG) return
  const method = (config.method ?? 'GET').toUpperCase()
  const url = getRequestUrl(config)
  // Evita poluir logs com headers sensíveis.
  console.debug(`[API][REQ] ${method} ${url}`, {
    params: config.params,
    data: config.data,
  })
}

const logResponse = (config: InternalAxiosRequestConfig, status: number, data: unknown): void => {
  if (!ENABLE_HTTP_DEBUG) return
  const method = (config.method ?? 'GET').toUpperCase()
  const url = getRequestUrl(config)
  console.debug(`[API][RES] ${status} ${method} ${url}`, data)
}

const logError = (error: AxiosError): void => {
  if (!ENABLE_HTTP_DEBUG) return
  const config = error.config as InternalAxiosRequestConfig | undefined
  const method = (config?.method ?? 'GET').toUpperCase()
  const url = config ? getRequestUrl(config) : '(url indisponível)'
  const status = error.response?.status ?? 'NETWORK'
  console.error(`[API][ERR] ${status} ${method} ${url}`, {
    message: error.message,
    response: error.response?.data,
  })
}

// Injeta Bearer token em todas as requisições (mesmo padrão do mobile)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    logRequest(config)
    return config
  },
  (error) => Promise.reject(error)
)

// 401 → dispara evento global para o AuthContext limpar a sessão (exceto no login)
api.interceptors.response.use(
  (response) => {
    logResponse(response.config as InternalAxiosRequestConfig, response.status, response.data)
    return response
  },
  (error: AxiosError) => {
    logError(error)
    const req = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const isLoginRequest = req?.url?.toLowerCase().includes('autenticacao/login')
    if (error.response?.status === 401 && !req._retry && !isLoginRequest) {
      req._retry = true
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export default api
