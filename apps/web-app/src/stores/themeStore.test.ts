import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light' })
  })

  it('inicia com mode light', () => {
    expect(useThemeStore.getState().mode).toBe('light')
  })

  it('setMode atualiza o mode', () => {
    useThemeStore.getState().setMode('dark')
    expect(useThemeStore.getState().mode).toBe('dark')

    useThemeStore.getState().setMode('system')
    expect(useThemeStore.getState().mode).toBe('system')
  })
})
