import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageWrapper } from '@/test/page-test-utils'
import { HabilidadeFormDialog } from './HabilidadeFormDialog'
import { criarHabilidade, atualizarHabilidade, excluirHabilidade } from '@/services/habilidadeService'

vi.mock('@/services/habilidadeService', () => ({
  criarHabilidade: vi.fn(),
  atualizarHabilidade: vi.fn(),
  excluirHabilidade: vi.fn(),
}))

function renderDialog(props: Partial<React.ComponentProps<typeof HabilidadeFormDialog>> = {}) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  render(
    <PageWrapper>
      <HabilidadeFormDialog open habilidade={null} onClose={onClose} onSaved={onSaved} {...props} />
    </PageWrapper>,
  )
  return { onClose, onSaved }
}

describe('HabilidadeFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bloqueia envio com campos obrigatórios vazios ou só espaços', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText(/^tipo/i), '   ')
    await user.type(screen.getByLabelText(/^descrição/i), '   ')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(await screen.findByText('Nível de ensino obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Tipo obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Descrição obrigatória')).toBeInTheDocument()
    expect(criarHabilidade).not.toHaveBeenCalled()
  })

  it('cria habilidade e avisa onSaved com criada=true', async () => {
    const user = userEvent.setup()
    vi.mocked(criarHabilidade).mockResolvedValue({ id: 10, descricao: 'Ler', ehPropria: true })
    const { onSaved, onClose } = renderDialog()

    await user.selectOptions(screen.getByLabelText(/nível de ensino/i), '2')
    await user.type(screen.getByLabelText(/^tipo/i), ' Habilidade ')
    await user.type(screen.getByLabelText(/^descrição/i), 'Ler')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 10, descricao: 'Ler', ehPropria: true }, true))
    expect(criarHabilidade).toHaveBeenCalledWith({
      idNivelEnsino: 2,
      tipo: 'Habilidade',
      descricao: 'Ler',
      resumo: undefined,
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('edita habilidade existente e avisa onSaved com criada=false', async () => {
    const user = userEvent.setup()
    vi.mocked(atualizarHabilidade).mockResolvedValue(undefined)
    const existente = { id: 5, idNivelEnsino: 1, tipo: 'Habilidade', descricao: 'Antiga', ehPropria: true }
    const { onSaved } = renderDialog({ habilidade: existente })

    const descricao = screen.getByLabelText(/^descrição/i)
    await user.clear(descricao)
    await user.type(descricao, 'Nova')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(atualizarHabilidade).toHaveBeenCalled())
    expect(atualizarHabilidade).toHaveBeenCalledWith(expect.objectContaining({ id: 5, descricao: 'Nova' }))
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 5, descricao: 'Nova' }), false)
  })

  it('não oferece exclusão ao criar', () => {
    renderDialog()

    expect(screen.queryByRole('button', { name: /^excluir$/i })).not.toBeInTheDocument()
  })

  it('exclui a habilidade só após confirmar', async () => {
    const user = userEvent.setup()
    vi.mocked(excluirHabilidade).mockResolvedValue(undefined)
    const existente = { id: 5, idNivelEnsino: 1, tipo: 'Habilidade', descricao: 'Antiga', ehPropria: true }
    const onDeleted = vi.fn()
    const { onClose } = renderDialog({ habilidade: existente, onDeleted })

    await user.click(screen.getByRole('button', { name: /^excluir$/i }))
    expect(excluirHabilidade).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /confirmar exclusão/i }))

    await waitFor(() => expect(excluirHabilidade).toHaveBeenCalledWith(5))
    expect(onDeleted).toHaveBeenCalledWith(5)
    expect(onClose).toHaveBeenCalled()
  })
})
