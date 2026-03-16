import { describe, it, expect } from 'vitest'
import OnboardingPage from './OnboardingPage'

describe('OnboardingPage', () => {
  it('exporta componente como default', () => {
    expect(typeof OnboardingPage).toBe('function')
  })
})
