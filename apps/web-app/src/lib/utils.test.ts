import { describe, it, expect } from 'vitest'
import { cn, sortByField } from './utils'

describe('cn', () => {
  it('combina classes condicionalmente', () => {
    expect(cn('a', 'b')).toBe('a b')
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('faz merge de classes Tailwind conflitantes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('retorna string vazia para inputs vazios', () => {
    expect(cn()).toBe('')
  })
})

describe('sortByField', () => {
  it('ordena alfabeticamente pelo campo (pt-BR)', () => {
    const arr = [
      { id: 1, nome: 'Carlos' },
      { id: 2, nome: 'Ana' },
      { id: 3, nome: 'Bruno' },
    ]
    const result = sortByField(arr, 'nome')
    expect(result.map((r) => r.nome)).toEqual(['Ana', 'Bruno', 'Carlos'])
  })

  it('não muta o array original', () => {
    const arr = [{ x: 'b' }, { x: 'a' }]
    sortByField(arr, 'x')
    expect(arr[0].x).toBe('b')
  })

  it('trata valores undefined/null como string vazia', () => {
    const arr = [{ x: 'a' }, { x: undefined }, { x: 'b' }]
    const result = sortByField(arr, 'x')
    expect(result[0].x).toBe(undefined)
    expect(result[1].x).toBe('a')
    expect(result[2].x).toBe('b')
  })
})
