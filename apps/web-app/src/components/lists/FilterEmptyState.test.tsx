import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FilterEmptyState } from './FilterEmptyState'

describe('FilterEmptyState', () => {
  it('mostra título de filtro quando há filtros ativos', () => {
    render(
      <FilterEmptyState
        hasActiveFilters
        filteredTitle="Nenhum resultado"
        defaultTitle="Lista vazia"
      />
    )
    expect(screen.getByRole('heading', { name: /nenhum resultado/i })).toBeInTheDocument()
  })

  it('mostra título e action padrão sem filtros', () => {
    render(
      <FilterEmptyState
        hasActiveFilters={false}
        filteredTitle="Nenhum resultado"
        defaultTitle="Lista vazia"
        defaultAction={<button>Criar</button>}
      />
    )
    expect(screen.getByRole('heading', { name: /lista vazia/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument()
  })
})
