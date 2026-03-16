import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTheme, initTheme } from './useTheme'
import { useThemeStore } from '@/stores/themeStore'

describe('useTheme', () => {
  it('é exportado e usa themeStore', () => {
    expect(typeof useTheme).toBe('function')
    expect(useThemeStore.getState().mode).toBeDefined()
  })
})

describe('initTheme', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    document.documentElement.classList.remove('dark')
  })

  it('aplica light quando localStorage vazio', () => {
    getItemSpy.mockReturnValue(null)

    initTheme()

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('aplica dark quando localStorage tem mode dark', () => {
    getItemSpy.mockReturnValue(JSON.stringify({ state: { mode: 'dark' } }))

    initTheme()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
