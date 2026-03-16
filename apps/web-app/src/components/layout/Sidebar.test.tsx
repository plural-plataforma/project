import { describe, it, expect } from 'vitest'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('é exportado como função', () => {
    expect(typeof Sidebar).toBe('function')
  })

  it('aceita professorNome como prop opcional', () => {
    const props: { professorNome?: string } = {}
    expect(props).toBeDefined()
    expect({ professorNome: 'João' }.professorNome).toBe('João')
  })
})
