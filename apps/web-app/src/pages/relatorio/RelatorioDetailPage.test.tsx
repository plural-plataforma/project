import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { screen } from '@testing-library/react'
import { configure } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import RelatorioDetailPage from './RelatorioDetailPage'
import { buscarRelatorioPorId, finalizarRelatorio } from '@/services/relatorioService'
import type { Relatorio, RelatorioSecao } from '@/types/relatorio'

// `@testing-library/react` fica só no node_modules da raiz e vem com seu próprio `act` (também
// da raiz). Como esta suíte monta a árvore com o React local do app (ver comentário abaixo),
// reconfiguramos o asyncWrapper do Testing Library para usar ESSE `act`, senão o `userEvent`
// dispara avisos de "not wrapped in act(...)" mesmo com o clique funcionando corretamente.
configure({
  asyncWrapper: async (callback) => {
    let result: unknown
    await act(async () => {
      result = await callback()
    })
    return result
  },
})

/**
 * `@tanstack/react-query`, `react-router-dom`, `framer-motion`, o `useToast` (zustand) e o
 * `Dialog` (Radix) só existem no node_modules da raiz do monorepo — enquanto este app tem seu
 * próprio React local (versão pinada diferente da usada pelo app mobile). Como o Vitest
 * externaliza dependências de node_modules (bypassando o alias que força um único React),
 * montar a árvore via `createRoot` local e mockar essas dependências evita o "Invalid hook
 * call" causado por essa duplicação — sem mexer em config compartilhada.
 */
vi.mock('@/services/relatorioService')

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@phosphor-icons/react', () => {
  const IconFallback = () => <svg />
  return {
    ArrowLeft: IconFallback,
    ArrowClockwise: IconFallback,
    CheckCircle: IconFallback,
    Copy: IconFallback,
    DownloadSimple: IconFallback,
    FilePdf: IconFallback,
    LockOpen: IconFallback,
    Warning: IconFallback,
    WarningCircle: IconFallback,
  }
})

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: { children?: React.ReactNode; className?: string }) => (
      <div className={props.className}>{props.children}</div>
    ),
  },
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), push: vi.fn() }),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open?: boolean; children?: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  DialogFooter: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

const queryMocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryFn: () => Promise<unknown>; enabled?: boolean }) => {
    if (opts.enabled === false) return { data: undefined, isLoading: false }
    return { data: (globalThis as { __relatorioFake?: unknown }).__relatorioFake, isLoading: false }
  },
  useMutation: (opts: { mutationFn: (variables?: unknown) => Promise<unknown>; onSuccess?: (r: unknown) => void; onError?: (e: unknown) => void }) => ({
    mutate: (variables?: unknown) => {
      queryMocks.mutate(variables)
      opts.mutationFn(variables).then(opts.onSuccess).catch(opts.onError)
    },
    isPending: queryMocks.isPending,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

function secaoFake(overrides: Partial<RelatorioSecao> = {}): RelatorioSecao {
  return {
    secaoChave: 0,
    textoGerado: 'Texto gerado pela IA.',
    textoEditado: null,
    textoRevisado: null,
    geradoEm: '2026-09-01T10:00:00Z',
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
    status: 0,
    formatoFinal: null,
    textoFinal: null,
    textoFinalGeradoEm: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    secoes: [],
    ...overrides,
  }
}

let container: HTMLDivElement | null = null
let root: Root | null = null

function renderDetailPage(overrides: Partial<Relatorio> = {}) {
  vi.mocked(buscarRelatorioPorId).mockResolvedValue(relatorioFake(overrides))
  ;(globalThis as { __relatorioFake?: unknown }).__relatorioFake = relatorioFake(overrides)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<RelatorioDetailPage />)
  })
}

afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  container = null
  root = null
})

describe('RelatorioDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exporta componente como default', () => {
    expect(typeof RelatorioDetailPage).toBe('function')
  })

  it('pede o formato antes de finalizar', async () => {
    vi.mocked(finalizarRelatorio).mockResolvedValue(relatorioFake({ status: 1 }))

    renderDetailPage({ status: 0, secoes: [secaoFake()] })

    await userEvent.click(screen.getByRole('button', { name: /finalizar/i }))

    expect(screen.getByText('Como você quer o documento final?')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Texto corrido' }))
    await userEvent.click(screen.getByRole('button', { name: /gerar versão final/i }))

    expect(finalizarRelatorio).toHaveBeenCalledWith(1, 1)
  })

  // Regressão do bloqueante "relatório pode ficar preso em RevisaoFinal para sempre": a fila de
  // revisão é em memória, então sem uma saída visível nos dois sub-estados abaixo (proposta
  // ainda não chegou / já chegou) um restart da API deixava a professora sem nenhum jeito de
  // sair da tela pela interface.
  it('mostra o spinner com botão de cancelar enquanto a proposta da revisão final ainda não chegou (status 4, textoFinalGeradoEm nulo)', () => {
    renderDetailPage({ status: 4, textoFinalGeradoEm: null, secoes: [secaoFake()] })

    expect(screen.getByText('A Plural está revisando o texto do relatório.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar revisão/i })).toBeInTheDocument()

    // Não é a mesma ação de "tentar novamente" da geração (status 2) — nesse sub-estado não
    // existe regeneração, só cancelar a revisão em andamento.
    expect(screen.queryByRole('button', { name: /tentar novamente/i })).not.toBeInTheDocument()
  })

  it('mostra o painel de antes/depois quando a proposta da revisão final já chegou (status 4, textoFinalGeradoEm preenchido)', () => {
    renderDetailPage({
      status: 4,
      textoFinalGeradoEm: '2026-09-17T12:00:00Z',
      formatoFinal: 0,
      secoes: [secaoFake({ textoEditado: 'Editado pela professora.', textoRevisado: 'Revisado pela IA.' })],
    })

    expect(screen.getByText('Revisão da IA pronta')).toBeInTheDocument()
    expect(screen.getByText('Revisado pela IA.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancelar revisão/i })).not.toBeInTheDocument()
  })

  it('esconde Finalizar/Reabrir/Duplicar/Baixar do cabeçalho enquanto a revisão final está em andamento', () => {
    renderDetailPage({ status: 4, textoFinalGeradoEm: null, secoes: [secaoFake()] })

    expect(screen.queryByRole('button', { name: /^finalizar$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /duplicar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reabrir/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /baixar/i })).not.toBeInTheDocument()
  })
})
