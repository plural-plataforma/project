import { create } from 'zustand'

type ToastVariant = 'default' | 'success' | 'danger' | 'warning'

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastStore {
  toasts: ToastItem[]
  push: (title: string, description?: string, variant?: ToastVariant) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (title, description, variant = 'default') =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), title, description, variant }],
    })),
  success: (title, description) =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), title, description, variant: 'success' }],
    })),
  error: (title, description) =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), title, description, variant: 'danger' }],
    })),
  warning: (title, description) =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), title, description, variant: 'warning' }],
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Imperative helper — usável fora de componentes (ex: interceptor axios)
export const toast = {
  push: (...args: Parameters<ToastStore['push']>) => useToastStore.getState().push(...args),
  success: (...args: Parameters<ToastStore['success']>) => useToastStore.getState().success(...args),
  error: (...args: Parameters<ToastStore['error']>) => useToastStore.getState().error(...args),
  warning: (...args: Parameters<ToastStore['warning']>) => useToastStore.getState().warning(...args),
}
