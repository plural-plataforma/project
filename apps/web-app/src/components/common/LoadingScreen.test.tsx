import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingScreen, InlineLoader } from './LoadingScreen'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('p', props, children),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

describe('LoadingScreen', () => {
  it('renderiza quando visible=true (padrão)', () => {
    render(<LoadingScreen />)
    expect(screen.getByRole('img', { name: /plural plataforma/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/carregando/i)).toBeInTheDocument()
  })

  it('não renderiza quando visible=false', () => {
    render(<LoadingScreen visible={false} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renderiza mensagem quando informada', () => {
    render(<LoadingScreen message="Salvando avaliação..." />)
    expect(screen.getByText('Salvando avaliação...')).toBeInTheDocument()
  })

  it('aplica fullscreen por padrão', () => {
    const { container } = render(<LoadingScreen />)
    const wrapper = container.querySelector('.fixed.inset-0')
    expect(wrapper).toBeInTheDocument()
  })

  it('aplica layout inline quando fullscreen=false', () => {
    const { container } = render(<LoadingScreen fullscreen={false} />)
    const wrapper = container.querySelector('.py-20')
    expect(wrapper).toBeInTheDocument()
  })
})

describe('InlineLoader', () => {
  it('renderiza com mensagem', () => {
    render(<InlineLoader message="Carregando dados..." />)
    expect(screen.getByText('Carregando dados...')).toBeInTheDocument()
  })
})
