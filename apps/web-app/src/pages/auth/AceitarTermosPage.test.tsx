import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AceitarTermosPage from './AceitarTermosPage'
import { useTermosPendentes } from '@/hooks/useTermosPendentes'

vi.mock('@/hooks/useTermosPendentes', () => ({
  useTermosPendentes: vi.fn(),
}))

describe('AceitarTermosPage', () => {
  const termoMock = {
    termoVersaoId: 1,
    chave: 'uso_ferramenta',
    nome: 'Termos de Uso da Ferramenta',
    versao: 1,
    texto: '<p>Texto do termo</p>',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra loading enquanto carrega', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [],
      isLoading: true,
      isError: false,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    const onAceito = vi.fn()
    const { container } = render(<AceitarTermosPage onAceito={onAceito} />)

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    expect(onAceito).not.toHaveBeenCalled()
  })

  it('renderiza o texto do termo pendente', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [termoMock],
      isLoading: false,
      isError: false,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    render(<AceitarTermosPage onAceito={vi.fn()} />)

    expect(screen.getByText('Termos de Uso da Ferramenta')).toBeInTheDocument()
    expect(screen.getByText('Texto do termo')).toBeInTheDocument()
  })

  it('chama aceitar e onAceito ao clicar no botão quando é o último termo pendente', async () => {
    const aceitarMock = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [termoMock],
      isLoading: false,
      isError: false,
      aceitar: aceitarMock,
      aceitando: false,
    } as any)

    const onAceito = vi.fn()
    render(<AceitarTermosPage onAceito={onAceito} />)

    fireEvent.click(screen.getByText('Aceitar e continuar'))

    await waitFor(() => {
      expect(aceitarMock).toHaveBeenCalledWith(1)
      expect(onAceito).toHaveBeenCalled()
    })
  })

  it('chama onAceito automaticamente quando não há termos pendentes (sucesso, lista vazia)', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [],
      isLoading: false,
      isError: false,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    const onAceito = vi.fn()
    render(<AceitarTermosPage onAceito={onAceito} />)

    expect(onAceito).toHaveBeenCalled()
  })

  it('NÃO chama onAceito quando a consulta falha — mostra erro em vez de liberar navegação', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [],
      isLoading: false,
      isError: true,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    const onAceito = vi.fn()
    render(<AceitarTermosPage onAceito={onAceito} />)

    expect(onAceito).not.toHaveBeenCalled()
    expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument()
  })
})
