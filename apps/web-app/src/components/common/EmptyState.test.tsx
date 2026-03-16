import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    render(<EmptyState title="Título" description="Descrição" />)
    expect(screen.getByRole('heading', { name: /título/i })).toBeInTheDocument()
    expect(screen.getByText('Descrição')).toBeInTheDocument()
  })

  it('renderiza apenas título quando descrição e action não são informados', () => {
    render(<EmptyState title="Só título" />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renderiza action quando informado', () => {
    render(
      <EmptyState title="Com ação" action={<button>Clique</button>} />
    )
    expect(screen.getByRole('button', { name: /clique/i })).toBeInTheDocument()
  })
})
