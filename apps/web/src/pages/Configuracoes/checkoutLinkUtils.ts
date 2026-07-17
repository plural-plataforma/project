import type { LinkCheckout } from '../../services/configuracoesService'

const HOTMART_URL_REGEX = /^https:\/\/([a-zA-Z0-9-]+\.)*hotmart\.com(\/.*)?$/i

export function normalizeCheckoutUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidHotmartUrl(value: string): boolean {
  const normalized = normalizeCheckoutUrl(value)
  return HOTMART_URL_REGEX.test(normalized)
}

export function validateLinkCheckout(data: LinkCheckout): string | null {
  const errors: string[] = []

  if (!data.pluralCheckoutUrlMensal.trim()) {
    errors.push('O link de venda mensal é obrigatório.')
  } else if (!isValidHotmartUrl(data.pluralCheckoutUrlMensal)) {
    errors.push('Informe uma URL válida da Hotmart para o link mensal (ex.: https://pay.hotmart.com/...).')
  }

  if (!data.pluralCheckoutUrlAnual.trim()) {
    errors.push('O link de venda anual é obrigatório.')
  } else if (!isValidHotmartUrl(data.pluralCheckoutUrlAnual)) {
    errors.push('Informe uma URL válida da Hotmart para o link anual (ex.: https://pay.hotmart.com/...).')
  }

  return errors.length > 0 ? errors.join(' ') : null
}

export function truncateUrl(url: string, maxLength = 48): string {
  if (url.length <= maxLength) return url
  const start = url.slice(0, 28)
  const end = url.slice(-12)
  return `${start}…${end}`
}
