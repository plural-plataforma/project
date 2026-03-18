import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepProgressBar } from './StepProgressBar'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
}))

describe('StepProgressBar', () => {
  it('renderiza labels dos steps', () => {
    const steps = [
      { label: 'Identificação' },
      { label: 'Alunos' },
      { label: 'Áreas' },
    ] as const

    render(<StepProgressBar steps={steps} currentStep={0} />)

    expect(screen.getByText('Identificação')).toBeInTheDocument()
    expect(screen.getByText('Alunos')).toBeInTheDocument()
    expect(screen.getByText('Áreas')).toBeInTheDocument()
  })

  it('renderiza número do step atual', () => {
    const steps = [{ label: 'Step 1' }, { label: 'Step 2' }] as const

    render(<StepProgressBar steps={steps} currentStep={1} />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
