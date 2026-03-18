import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PageHeader } from './PageHeader'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PageHeader', () => {
  it('renderiza título', () => {
    renderWithRouter(<PageHeader title="Página" />)
    expect(screen.getByRole('heading', { name: /página/i })).toBeInTheDocument()
  })

  it('renderiza descrição quando informada', () => {
    renderWithRouter(<PageHeader title="Página" description="Descrição da página" />)
    expect(screen.getByText('Descrição da página')).toBeInTheDocument()
  })

  it('renderiza botão voltar quando backTo informado', () => {
    renderWithRouter(<PageHeader title="Página" backTo="/dashboard" />)
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument()
  })

  it('não renderiza botão voltar quando backTo não informado', () => {
    renderWithRouter(<PageHeader title="Página" />)
    expect(screen.queryByRole('button', { name: /voltar/i })).not.toBeInTheDocument()
  })

  it('renderiza action quando informado', () => {
    renderWithRouter(
      <PageHeader title="Página" action={<button>Nova ação</button>} />
    )
    expect(screen.getByRole('button', { name: /nova ação/i })).toBeInTheDocument()
  })
})
