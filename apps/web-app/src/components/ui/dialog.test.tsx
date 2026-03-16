import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from './dialog'

describe('Dialog', () => {
  it('renderiza trigger', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Abrir</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título</DialogTitle>
            <DialogDescription>Descrição</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    expect(screen.getByRole('button', { name: /abrir/i })).toBeInTheDocument()
  })

  it('abre e exibe conteúdo ao clicar no trigger', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Abrir</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título do modal</DialogTitle>
            <DialogDescription>Descrição do modal</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByRole('button', { name: /abrir/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Título do modal')).toBeInTheDocument()
    expect(screen.getByText('Descrição do modal')).toBeInTheDocument()
  })

  it('tem botão fechar acessível', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Abrir</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Título</DialogTitle>
          <DialogDescription>Descrição para acessibilidade</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByRole('button', { name: /abrir/i }))

    expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument()
  })
})
