import { describe, it, expect } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('é exportado como função', () => {
    expect(typeof AppShell).toBe('function')
  })
})
