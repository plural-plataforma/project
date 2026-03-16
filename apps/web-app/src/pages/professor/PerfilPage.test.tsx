import { describe, it, expect } from 'vitest'
import PerfilPage from './PerfilPage'

describe('PerfilPage', () => {
  it('exporta componente como default', () => {
    expect(typeof PerfilPage).toBe('function')
  })
})
