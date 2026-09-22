import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvisoLimiteUsoIA } from './AvisoLimiteUsoIA'
import type { LimiteUsoIA } from '@/types/usoIA'

const limiteMock = vi.hoisted(() => ({ atual: undefined as LimiteUsoIA | undefined }))

vi.mock('@/hooks/useLimiteUsoIA', () => ({
  useLimiteUsoIA: () => ({
    limite: limiteMock.atual,
    limiteDiarioAtingido: limiteMock.atual?.limiteDiarioAtingido ?? false,
  }),
}))

vi.mock('@phosphor-icons/react', () => ({
  Sparkle: () => null,
}))

function limite(overrides: Partial<LimiteUsoIA> = {}): LimiteUsoIA {
  return {
    usoHoje: 3,
    limiteDiario: 20,
    limiteDiarioAtingido: false,
    usoMes: 10,
    limiteMensal: 50,
    limiteMensalAtingido: false,
    ...overrides,
  }
}

describe('AvisoLimiteUsoIA', () => {
  beforeEach(() => {
    limiteMock.atual = undefined
  })

  it('não renderiza enquanto o uso não foi carregado', () => {
    const { container } = render(<AvisoLimiteUsoIA />)
    expect(container).toBeEmptyDOMElement()
  })

  it('não renderiza abaixo dos limites', () => {
    limiteMock.atual = limite()
    const { container } = render(<AvisoLimiteUsoIA />)
    expect(container).toBeEmptyDOMElement()
  })

  it('avisa sem bloquear quando o limite mensal é atingido', () => {
    limiteMock.atual = limite({ usoMes: 52, limiteMensalAtingido: true })
    render(<AvisoLimiteUsoIA />)
    expect(screen.getByText('Uso de IA acima do previsto este mês')).toBeInTheDocument()
    expect(screen.getByText(/52 gerações com IA este mês/)).toBeInTheDocument()
  })

  it('prioriza o aviso de bloqueio quando o limite diário é atingido', () => {
    limiteMock.atual = limite({ usoHoje: 20, limiteDiarioAtingido: true, usoMes: 60, limiteMensalAtingido: true })
    render(<AvisoLimiteUsoIA />)
    expect(screen.getByText('Limite diário de geração com IA atingido')).toBeInTheDocument()
    expect(screen.queryByText('Uso de IA acima do previsto este mês')).not.toBeInTheDocument()
  })
})
