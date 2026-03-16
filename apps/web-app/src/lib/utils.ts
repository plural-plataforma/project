import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ordena um array de objetos alfabeticamente pelo campo especificado (locale-aware). */
export function sortByField<T>(arr: T[], field: keyof T): T[] {
  return [...arr].sort((a, b) => {
    const va = String(a[field] ?? '').trim()
    const vb = String(b[field] ?? '').trim()
    return va.localeCompare(vb, 'pt-BR', { sensitivity: 'base' })
  })
}
