import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './input'

describe('Input', () => {
  it('renderiza input', () => {
    render(<Input placeholder="Digite" />)
    expect(screen.getByPlaceholderText('Digite')).toBeInTheDocument()
  })

  it('renderiza label quando informado', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('associa label ao input via htmlFor', () => {
    render(<Input label="Nome" id="nome-id" />)
    const input = screen.getByLabelText(/nome/i)
    expect(input).toHaveAttribute('id', 'nome-id')
  })

  it('renderiza mensagem de erro quando error informado', () => {
    render(<Input error="Campo obrigatório" />)
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('aplica classe de erro ao input', () => {
    render(<Input error="Erro" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('border-danger')
  })
})
