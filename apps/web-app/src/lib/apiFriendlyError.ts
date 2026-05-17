import type { AxiosError } from 'axios'

/** Anexado pelo interceptor em `apps/web-app/src/api/http.ts`. */
export interface FriendlyApiErrorPayload {
  title: string
  description: string
  /** Texto curto para a usuária informar ao suporte (sem stack trace). */
  supportHint: string
}

const TECH_PATTERNS =
  /\b(Npgsql\.|Microsoft\.(EntityFrameworkCore|AspNetCore)|System\.|PostgresException|SqlState:|Stack trace|\.cs:line\s+\d+|D:\\|DELETE FROM|INSERT INTO)\b/i

function looksTechnicalMessage(text: string): boolean {
  const t = text.trim()
  if (t.length > 480) return true
  if (TECH_PATTERNS.test(t)) return true
  if (/\bat\s+[\w.]+\(/i.test(t)) return true
  return false
}

function safeTrimUserJsonMessage(text: string): string | null {
  const t = text.trim()
  if (!t || looksTechnicalMessage(t)) return null
  return t.length > 350 ? `${t.slice(0, 347)}…` : t
}

function endpointHint(config?: { method?: string; url?: string }): string {
  const method = (config?.method ?? 'GET').toUpperCase()
  const url = config?.url ?? ''
  const path = url.replace(/^\/+/, '') || '(rota)'
  return `${method} /${path}`
}

/**
 * Constrói mensagem amigável a partir da resposta HTTP (inclui páginas de exceção do ASP.NET e texto/HTML cru).
 */
export function buildFriendlyApiFeedback(error: AxiosError): FriendlyApiErrorPayload {
  const status = error.response?.status
  const cfg = error.config
  const hint = endpointHint(cfg)

  if (error.code === 'ECONNABORTED') {
    return {
      title: 'Tempo esgotado',
      description:
        'O servidor demorou demais para responder. Verifique sua conexão e tente de novo. Se o problema continuar, fale com o suporte.',
      supportHint: `Timeout · ${hint}`,
    }
  }

  if (!error.response) {
    return {
      title: 'Sem conexão',
      description:
        'Não foi possível contatar o servidor. Confira sua internet, firewall ou VPN. Se estiver tudo certo, o sistema pode estar em manutenção — tente mais tarde ou avise o suporte.',
      supportHint: `Sem resposta · ${hint}`,
    }
  }

  const st = status ?? 0
  const headers = error.response.headers ?? {}
  const contentType = String(headers['content-type'] ?? headers['Content-Type'] ?? '')
  const rawData = error.response.data

  const isHtmlPayload =
    contentType.includes('text/html') ||
    (typeof rawData === 'string' && /^\s*</.test(rawData) && rawData.toLowerCase().includes('<!doc'))

  if (isHtmlPayload || (typeof rawData === 'string' && rawData.length > 800 && looksTechnicalMessage(rawData))) {
    return {
      title: st >= 500 ? 'Serviço indisponível no momento' : 'Não foi possível concluir',
      description:
        st >= 500
          ? 'Encontramos uma falha no servidor ao processar seu pedido. Isso costuma ser temporário. Aguarde alguns minutos e tente novamente. Se precisar de ajuda, entre em contato com o suporte e informe o código abaixo.'
          : 'Não conseguimos interpretar a resposta do servidor. Atualize a página ou tente de novo em instantes. Se repetir, fale com o suporte com o código abaixo.',
      supportHint: `HTTP ${st} · ${hint} · ${new Date().toISOString()}`,
    }
  }

  if (typeof rawData === 'string') {
    const cleaned = safeTrimUserJsonMessage(rawData)
    if (cleaned) {
      return {
        title: st >= 400 && st < 500 ? 'Não foi possível concluir' : 'Algo deu errado',
        description: cleaned,
        supportHint: `HTTP ${st} · ${hint}`,
      }
    }
    return {
      title: st >= 500 ? 'Serviço indisponível no momento' : 'Erro ao comunicar com o servidor',
      description:
        'Recebemos uma resposta inesperada do servidor. Tente novamente. Se o problema continuar, envie ao suporte o código abaixo (sem precisar copiar telas longas).',
      supportHint: `HTTP ${st} · ${hint} · ${new Date().toISOString()}`,
    }
  }

  if (rawData && typeof rawData === 'object') {
    const o = rawData as Record<string, unknown>

    const mensagens = o.mensagens
    if (Array.isArray(mensagens) && mensagens.length > 0 && mensagens.every((m) => typeof m === 'string')) {
      const joined = (mensagens as string[]).join(' ')
      const nice = safeTrimUserJsonMessage(joined)
      if (nice) {
        return {
          title: st >= 500 ? 'Algo deu errado' : 'Não foi possível concluir',
          description: nice,
          supportHint: `HTTP ${st} · ${hint}`,
        }
      }
    }

    for (const key of ['message', 'detail', 'title'] as const) {
      const v = o[key]
      if (typeof v === 'string') {
        const nice = safeTrimUserJsonMessage(v)
        if (nice) {
          return {
            title: st >= 500 ? 'Erro no servidor' : 'Não foi possível concluir',
            description: nice,
            supportHint: `HTTP ${st} · ${hint}`,
          }
        }
      }
    }

    const errs = o.errors
    if (errs && typeof errs === 'object') {
      const first = Object.values(errs as Record<string, unknown>).flatMap((v) =>
        Array.isArray(v) ? v : [v]
      )[0]
      if (typeof first === 'string') {
        const nice = safeTrimUserJsonMessage(first)
        if (nice) {
          return {
            title: 'Verifique os dados',
            description: nice,
            supportHint: `HTTP ${st} · ${hint}`,
          }
        }
      }
    }
  }

  if (st === 401) {
    return {
      title: 'Sessão ou credenciais',
      description: 'E-mail ou senha incorretos. Verifique e tente novamente.',
      supportHint: `HTTP 401 · ${hint}`,
    }
  }
  if (st === 403) {
    return {
      title: 'Acesso negado',
      description: 'Você não tem permissão para esta ação. Se precisar de acesso, fale com o suporte.',
      supportHint: `HTTP 403 · ${hint}`,
    }
  }
  if (st === 404) {
    return {
      title: 'Não encontrado',
      description: 'O recurso solicitado não existe ou foi movido. Atualize a página ou volte ao menu anterior.',
      supportHint: `HTTP 404 · ${hint}`,
    }
  }
  if (st >= 500) {
    return {
      title: 'Serviço indisponível no momento',
      description:
        'Ocorreu um erro no servidor. Tente novamente em alguns minutos. Se continuar, entre em contato com o suporte e envie o código abaixo.',
      supportHint: `HTTP ${st} · ${hint} · ${new Date().toISOString()}`,
    }
  }

  return {
    title: 'Não foi possível concluir',
    description: 'Algo saiu do esperado. Tente de novo. Se repetir, fale com o suporte com o código abaixo.',
    supportHint: `HTTP ${st || '?'} · ${hint} · ${new Date().toISOString()}`,
  }
}

export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  )
}

/**
 * Preferência: payload já anexado pelo interceptor; senão recalcula (útil em testes).
 */
export function getApiErrorFeedback(error: unknown): FriendlyApiErrorPayload {
  if (isAxiosError(error)) {
    const tagged = error as AxiosError & { friendlyApiError?: FriendlyApiErrorPayload }
    if (tagged.friendlyApiError) return tagged.friendlyApiError
    return buildFriendlyApiFeedback(error)
  }
  if (error instanceof Error) {
    const msg = error.message?.trim()
    if (msg && !looksTechnicalMessage(msg)) {
      return { title: 'Erro', description: msg, supportHint: '' }
    }
    return {
      title: 'Erro',
      description: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
      supportHint: '',
    }
  }
  return {
    title: 'Erro',
    description: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
    supportHint: '',
  }
}

export function formatFriendlyErrorBody(fb: FriendlyApiErrorPayload): string {
  return fb.supportHint.trim().length > 0
    ? `${fb.description}\n\nInforme ao suporte: ${fb.supportHint}`
    : fb.description
}

/** Uma string única para toasts/alerts legados. */
export function getApiErrorMessageForUser(error: unknown): string {
  return formatFriendlyErrorBody(getApiErrorFeedback(error))
}
