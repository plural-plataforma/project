import { describe, it, expect } from 'vitest'
import DashboardPage from './DashboardPage'

describe('DashboardPage', () => {
  it('exporta componente como default', () => {
    expect(typeof DashboardPage).toBe('function')
  })
})
