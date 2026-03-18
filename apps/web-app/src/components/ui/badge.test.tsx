import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('renderiza children', () => {
    render(<Badge>Ativo</Badge>)
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('aplica variant success', () => {
    render(<Badge variant="success">Concluído</Badge>)
    expect(screen.getByText('Concluído')).toHaveClass('bg-success-light')
  })

  it('aplica variant danger', () => {
    render(<Badge variant="danger">Erro</Badge>)
    expect(screen.getByText('Erro')).toHaveClass('bg-danger-light')
  })
})
