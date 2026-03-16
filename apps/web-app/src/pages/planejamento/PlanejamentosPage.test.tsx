import { describe, it, expect } from 'vitest'
import PlanejamentosPage from './PlanejamentosPage'

describe('PlanejamentosPage', () => {
  it('exporta componente como default', () => {
    expect(typeof PlanejamentosPage).toBe('function')
  })
})
