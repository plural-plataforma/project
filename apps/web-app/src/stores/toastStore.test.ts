import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useToastStore, toast } from './toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-1')
  })

  describe('push', () => {
    it('adiciona toast com variant default', () => {
      useToastStore.getState().push('Título')
      const toasts = useToastStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0]).toMatchObject({ title: 'Título', variant: 'default' })
      expect(toasts[0].id).toBe('uuid-1')
    })

    it('adiciona toast com description e variant', () => {
      useToastStore.getState().push('Título', 'Descrição', 'success')
      const toasts = useToastStore.getState().toasts
      expect(toasts[0]).toMatchObject({
        title: 'Título',
        description: 'Descrição',
        variant: 'success',
      })
    })
  })

  describe('success', () => {
    it('adiciona toast com variant success', () => {
      useToastStore.getState().success('Sucesso!')
      expect(useToastStore.getState().toasts[0].variant).toBe('success')
    })
  })

  describe('error', () => {
    it('adiciona toast com variant danger', () => {
      useToastStore.getState().error('Erro!')
      expect(useToastStore.getState().toasts[0].variant).toBe('danger')
    })
  })

  describe('warning', () => {
    it('adiciona toast com variant warning', () => {
      useToastStore.getState().warning('Atenção!')
      expect(useToastStore.getState().toasts[0].variant).toBe('warning')
    })
  })

  describe('dismiss', () => {
    it('remove toast pelo id', () => {
      vi.mocked(crypto.randomUUID)
        .mockReturnValueOnce('id-a')
        .mockReturnValueOnce('id-b')
      useToastStore.getState().push('A')
      useToastStore.getState().push('B')

      useToastStore.getState().dismiss('id-a')

      expect(useToastStore.getState().toasts).toHaveLength(1)
      expect(useToastStore.getState().toasts[0].id).toBe('id-b')
      expect(useToastStore.getState().toasts[0].title).toBe('B')
    })
  })

  describe('toast (imperative helper)', () => {
    it('push chama o store', () => {
      toast.push('Via helper')
      expect(useToastStore.getState().toasts[0].title).toBe('Via helper')
    })

    it('success chama o store', () => {
      toast.success('Sucesso via helper')
      expect(useToastStore.getState().toasts[0].title).toBe('Sucesso via helper')
      expect(useToastStore.getState().toasts[0].variant).toBe('success')
    })
  })
})
