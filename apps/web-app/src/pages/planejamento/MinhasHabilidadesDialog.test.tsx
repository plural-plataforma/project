import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageWrapper } from '@/test/page-test-utils'
import { MinhasHabilidadesDialog } from './MinhasHabilidadesDialog'
import { atualizarHabilidade, buscarHabilidades } from '@/services/habilidadeService'

vi.mock('@/services/habilidadeService', () => ({
  buscarHabilidades: vi.fn(),
  atualizarHabilidade: vi.fn(),
}))

const habilidades = [
  { id: 1, descricao: 'Global do catálogo', idNivelEnsino: 1, ativo: true, ehPropria: false },
  { id: 2, descricao: 'Minha ativa', idNivelEnsino: 2, ativo: true, ehPropria: true },
  { id: 3, descricao: 'Minha desativada', idNivelEnsino: 2, ativo: false, ehPropria: true },
]

function renderDialog(props: Partial<React.ComponentProps<typeof MinhasHabilidadesDialog>> = {}) {
  const onEditar = vi.fn()
  const onNova = vi.fn()
  render(
    <PageWrapper>
      <MinhasHabilidadesDialog open onClose={vi.fn()} onNova={onNova} onEditar={onEditar} {...props} />
    </PageWrapper>,
  )
  return { onEditar, onNova }
}

describe('MinhasHabilidadesDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buscarHabilidades).mockResolvedValue(habilidades)
  })

  it('lista só as habilidades próprias, ativas e desativadas', async () => {
    renderDialog()

    expect(await screen.findByText('Minha ativa')).toBeInTheDocument()
    expect(screen.getByText('Minha desativada')).toBeInTheDocument()
    expect(screen.getByText('Desativada')).toBeInTheDocument()
    expect(screen.queryByText('Global do catálogo')).not.toBeInTheDocument()
  })

  it('reativa uma habilidade desativada', async () => {
    const user = userEvent.setup()
    vi.mocked(atualizarHabilidade).mockResolvedValue(undefined)
    renderDialog()

    await screen.findByText('Minha desativada')
    await user.click(screen.getByRole('button', { name: /reativar habilidade/i }))

    await waitFor(() => expect(atualizarHabilidade).toHaveBeenCalledWith({ id: 3, ativo: true }))
  })

  it('desativa uma habilidade ativa', async () => {
    const user = userEvent.setup()
    vi.mocked(atualizarHabilidade).mockResolvedValue(undefined)
    renderDialog()

    await screen.findByText('Minha ativa')
    await user.click(screen.getByRole('button', { name: /desativar habilidade/i }))

    await waitFor(() => expect(atualizarHabilidade).toHaveBeenCalledWith({ id: 2, ativo: false }))
  })

  it('abre a edição da habilidade escolhida', async () => {
    const user = userEvent.setup()
    const { onEditar } = renderDialog()

    await screen.findByText('Minha ativa')
    await user.click(screen.getAllByRole('button', { name: /editar habilidade/i })[0])

    expect(onEditar).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
  })
})
