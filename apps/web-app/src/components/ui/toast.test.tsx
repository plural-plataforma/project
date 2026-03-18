import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './toast'

describe('Toast (Radix)', () => {
  it('renderiza Toast com título e descrição', () => {
    render(
      <ToastProvider>
        <ToastViewport />
        <Toast>
          <ToastTitle>Título</ToastTitle>
          <ToastDescription>Descrição</ToastDescription>
          <ToastClose aria-label="Fechar" />
        </Toast>
      </ToastProvider>
    )
    expect(screen.getByText('Título')).toBeInTheDocument()
    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument()
  })

  it('renderiza com variant success', () => {
    render(
      <ToastProvider>
        <ToastViewport />
        <Toast variant="success">
          <ToastTitle>Sucesso</ToastTitle>
        </Toast>
      </ToastProvider>
    )
    expect(screen.getByText('Sucesso')).toBeInTheDocument()
  })
})
