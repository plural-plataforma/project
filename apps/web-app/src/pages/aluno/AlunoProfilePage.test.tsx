import { describe, it, expect } from 'vitest'
import AlunoProfilePage from './AlunoProfilePage'

describe('AlunoProfilePage', () => {
  it('exporta componente como default', () => {
    expect(typeof AlunoProfilePage).toBe('function')
  })
})
