import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renderiza children', () => {
    render(<Button>Clique</Button>)
    expect(screen.getByRole('button', { name: /clique/i })).toBeInTheDocument()
  })

  it('chama onClick quando clicado', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clique</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('não chama onClick quando disabled', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Clique</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('mostra loading e desabilita quando loading=true', () => {
    render(<Button loading>Salvar</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('span.animate-spin')).toBeInTheDocument()
  })

  it('aplica variant via data ou classes', () => {
    const { rerender } = render(<Button variant="outline">Out</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-primary')

    rerender(<Button variant="destructive">Del</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-danger')
  })
})
