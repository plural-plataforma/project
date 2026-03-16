import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from './onboardingStore'

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({ hasSeenOnboarding: false })
  })

  it('inicia com hasSeenOnboarding false', () => {
    useOnboardingStore.setState({ hasSeenOnboarding: false })
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(false)
  })

  it('setHasSeenOnboarding atualiza o valor', () => {
    useOnboardingStore.getState().setHasSeenOnboarding(true)
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(true)

    useOnboardingStore.getState().setHasSeenOnboarding(false)
    expect(useOnboardingStore.getState().hasSeenOnboarding).toBe(false)
  })
})
