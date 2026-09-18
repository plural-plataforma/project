import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RelatorioRevisaoFinal } from './RelatorioRevisaoFinal'
import type { Relatorio, RelatorioSecao, RelatorioSecaoChaveCodigo } from '@/types/relatorio'

function secaoFake(secaoChave: RelatorioSecaoChaveCodigo, overrides: Partial<RelatorioSecao> = {}): RelatorioSecao {
  return {
    secaoChave,
    textoGerado: null,
    textoEditado: null,
    textoRevisado: null,
    geradoEm: null,
    editadoEm: null,
    informacaoInsuficiente: false,
    ...overrides,
  }
}

function relatorioFake(overrides: Partial<Relatorio> = {}): Relatorio {
  return {
    id: 1,
    alunoId: 10,
    alunoNome: 'Aluno Teste',
    dataInicio: '2026-01-01',
    dataFim: '2026-06-30',
    tipoPeriodo: 0,
    status: 4,
    formatoFinal: 0,
    textoFinal: null,
    textoFinalGeradoEm: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    secoes: [],
    ...overrides,
  }
}

function props(overrides: Partial<Parameters<typeof RelatorioRevisaoFinal>[0]> = {}) {
  return {
    relatorio: relatorioFake({ formatoFinal: 0, textoFinalGeradoEm: '2026-09-17T12:00:00Z', secoes: [] }),
    aceitando: false,
    descartando: false,
    onAceitar: vi.fn(),
    onDescartar: vi.fn(),
    ...overrides,
  }
}

describe('RelatorioRevisaoFinal', () => {
  it('mostra antes e depois de cada seção editada no modo tópicos', () => {
    render(
      <RelatorioRevisaoFinal
        {...props({
          relatorio: relatorioFake({
            formatoFinal: 0,
            textoFinalGeradoEm: '2026-09-17T12:00:00Z',
            secoes: [
              secaoFake(0, { textoEditado: 'Leo é preguiçoso.', textoRevisado: 'Demonstra pouca iniciativa.' }),
              secaoFake(1, { textoGerado: 'Texto da IA.', textoRevisado: null }),
            ],
          }),
        })}
      />
    )

    expect(screen.getByText('Leo é preguiçoso.')).toBeInTheDocument()
    expect(screen.getByText('Demonstra pouca iniciativa.')).toBeInTheDocument()
    expect(screen.queryByText('Texto da IA.')).not.toBeInTheDocument()
  })

  it('mostra o texto corrido completo no modo texto corrido', () => {
    render(
      <RelatorioRevisaoFinal
        {...props({
          relatorio: relatorioFake({
            formatoFinal: 1,
            textoFinalGeradoEm: '2026-09-17T12:00:00Z',
            textoFinal: 'Texto corrido revisado pela IA.',
            secoes: [secaoFake(0, { textoEditado: 'Leo é preguiçoso.', textoRevisado: null })],
          }),
        })}
      />
    )

    expect(screen.getByText('Leo é preguiçoso.')).toBeInTheDocument()
    expect(screen.getByText('Texto corrido revisado pela IA.')).toBeInTheDocument()
  })

  it('dispara aceitar e descartar', async () => {
    const onAceitar = vi.fn()
    const onDescartar = vi.fn()
    render(<RelatorioRevisaoFinal {...props({ onAceitar, onDescartar })} />)

    await userEvent.click(screen.getByRole('button', { name: /usar esta versão/i }))
    expect(onAceitar).toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /descartar/i }))
    expect(onDescartar).toHaveBeenCalled()
  })
})
