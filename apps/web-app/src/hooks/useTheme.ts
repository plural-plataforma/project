import { useEffect } from 'react'
import { useThemeStore, type ThemeMode } from '@/stores/themeStore'

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const { mode, setMode } = useThemeStore()

  useEffect(() => {
    applyTheme(mode)

    if (mode !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  return { mode, setMode }
}

// Inicialização sem hook (para main.tsx — antes do primeiro render)
export function initTheme() {
  try {
    const stored = JSON.parse(localStorage.getItem('plural-theme') ?? '{}')
    applyTheme((stored.state?.mode as ThemeMode) ?? 'light')
  } catch {
    applyTheme('light')
  }
}
