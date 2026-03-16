import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

describe('Select', () => {
  it('renderiza trigger com placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Escolha..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Opção A</SelectItem>
          <SelectItem value="b">Opção B</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Escolha...')).toBeInTheDocument()
  })

  it('renderiza com valor selecionado quando value controlado', () => {
    render(
      <Select value="a">
        <SelectTrigger>
          <SelectValue placeholder="Escolha..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Opção A</SelectItem>
          <SelectItem value="b">Opção B</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText('Opção A')).toBeInTheDocument()
  })
})
