import { describe, it, expect } from 'vitest'
import AvaliacaoWizardPage from './AvaliacaoWizardPage'

describe('AvaliacaoWizardPage', () => {
  it('exporta componente como default', () => {
    expect(typeof AvaliacaoWizardPage).toBe('function')
  })
})
