import { describe, it, expect } from 'vitest'
import AlunosPage from './AlunosPage'

describe('AlunosPage', () => {
  it('exporta componente como default', () => {
    expect(typeof AlunosPage).toBe('function')
  })
})
