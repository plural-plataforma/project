import { describe, it, expect } from 'vitest'
import PlanejamentoDetailPage from './PlanejamentoDetailPage'

describe('PlanejamentoDetailPage', () => {
  it('exporta componente como default', () => {
    expect(typeof PlanejamentoDetailPage).toBe('function')
  })
})
