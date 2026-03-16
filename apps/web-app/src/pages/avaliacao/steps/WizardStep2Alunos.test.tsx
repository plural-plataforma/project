import { describe, it, expect } from 'vitest'
import { WizardStep2Alunos } from './WizardStep2Alunos'

describe('WizardStep2Alunos', () => {
  it('exporta componente', () => {
    expect(typeof WizardStep2Alunos).toBe('function')
  })
})
