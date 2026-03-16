import { describe, it, expect } from 'vitest'
import { WizardStep1Identificacao } from './WizardStep1Identificacao'

describe('WizardStep1Identificacao', () => {
  it('exporta componente', () => {
    expect(typeof WizardStep1Identificacao).toBe('function')
  })
})
