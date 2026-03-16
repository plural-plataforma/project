import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// Em dev: usa proxy do Vite (/api → API_TARGET) para evitar CORS
// Em prod (build): usa VITE_API_URL diretamente (sem proxy)
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? 'http://localhost:5145/api'

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
