import { describe, it, expect } from 'vitest'
import { AppRouter } from './index'

describe('routes/index', () => {
  it('exporta AppRouter como função', () => {
    expect(typeof AppRouter).toBe('function')
  })
})
