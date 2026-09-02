import { describe, it, expect } from 'vitest'
import RelatorioDetailPage from './RelatorioDetailPage'

describe('RelatorioDetailPage', () => {
  it('exporta componente como default', () => {
    expect(typeof RelatorioDetailPage).toBe('function')
  })
})
