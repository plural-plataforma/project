import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HistoryTimelinePanel } from './HistoryTimelinePanel'

describe('HistoryTimelinePanel', () => {
  it('renderiza empty state', () => {
    render(<HistoryTimelinePanel entries={[]} emptyMessage="Sem histórico" />)
    expect(screen.getByText('Sem histórico')).toBeInTheDocument()
  })

  it('renderiza entradas com título e badge', () => {
    render(
      <HistoryTimelinePanel
        entries={[
          {
            id: 1,
            kind: 'activity',
            occurredAt: '2026-06-14T15:00:00Z',
            primary: 'Maria Silva',
            secondary: 'Atividade de leitura',
            badge: { label: 'Autonomia', variant: 'success' },
          },
        ]}
      />
    )
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Atividade de leitura')).toBeInTheDocument()
    expect(screen.getByText('Autonomia')).toBeInTheDocument()
  })
})
