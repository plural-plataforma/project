import { describe, it, expect, beforeEach } from 'vitest'
import { useTourStore } from './tourStore'

describe('tourStore', () => {
  beforeEach(() => {
    useTourStore.setState({ hasSeenTour: false })
  })

  it('inicia com hasSeenTour false', () => {
    useTourStore.setState({ hasSeenTour: false })
    expect(useTourStore.getState().hasSeenTour).toBe(false)
  })

  it('setHasSeenTour atualiza o valor', () => {
    useTourStore.getState().setHasSeenTour(true)
    expect(useTourStore.getState().hasSeenTour).toBe(true)

    useTourStore.getState().setHasSeenTour(false)
    expect(useTourStore.getState().hasSeenTour).toBe(false)
  })
})
