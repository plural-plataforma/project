import { LinksWhatsApp } from '../../services/configuracoesService'

const URL_REGEX = /^https?:\/\/.+/i

export function normalizeWhatsappUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidWhatsappUrl(value: string): boolean {
  const normalized = normalizeWhatsappUrl(value)
  if (!URL_REGEX.test(normalized)) return false

  try {
    const url = new URL(normalized)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateLinks(data: LinksWhatsApp): string | null {
  const errors: string[] = []

  if (!data.morganaWhatsappUrl.trim()) {
    errors.push('O link do grupo da Morgana é obrigatório.')
  } else if (!isValidWhatsappUrl(data.morganaWhatsappUrl)) {
    errors.push('Informe uma URL válida para o link da Morgana (ex.: https://chat.whatsapp.com/...).')
  }

  if (!data.pluralWhatsappUrl.trim()) {
    errors.push('O link do grupo da Plural é obrigatório.')
  } else if (!isValidWhatsappUrl(data.pluralWhatsappUrl)) {
    errors.push('Informe uma URL válida para o link da Plural (ex.: https://chat.whatsapp.com/...).')
  }

  return errors.length > 0 ? errors.join(' ') : null
}

export function truncateUrl(url: string, maxLength = 48): string {
  if (url.length <= maxLength) return url
  const start = url.slice(0, 28)
  const end = url.slice(-12)
  return `${start}…${end}`
}
