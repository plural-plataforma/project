import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'
import { useToastStore } from '@/stores/toastStore'

describe('useToast', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('retorna toasts e funções do store', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.toasts).toEqual([])
    expect(typeof result.current.push).toBe('function')
    expect(typeof result.current.success).toBe('function')
    expect(typeof result.current.error).toBe('function')
    expect(typeof result.current.warning).toBe('function')
    expect(typeof result.current.dismiss).toBe('function')
  })

  it('push adiciona toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.push('Título', 'Descrição')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Título')
    expect(result.current.toasts[0].description).toBe('Descrição')
  })
})
