import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Buildings } from '@phosphor-icons/react'
import { ResourceListCard } from './ResourceListCard'

describe('ResourceListCard', () => {
  it('renderiza título, badges e ações', () => {
    render(
      <ResourceListCard
        icon={<Buildings data-testid="icon" />}
        title="Escola Municipal"
        badges={[{ label: 'Em andamento', variant: 'success' }]}
        meta={<p>Meta info</p>}
        actions={<button type="button">Editar</button>}
      />
    )
    expect(screen.getByRole('heading', { name: /escola municipal/i })).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.getByText('Meta info')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  it('aplica faixa lateral amber no card padrão', () => {
    const { container } = render(
      <ResourceListCard title="Item da lista" />
    )
    const card = container.querySelector('.border-l-amber')
    expect(card).toBeTruthy()
  })
})
