import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('Tabs', () => {
  it('renderiza tabs e conteúdo', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Conteúdo 1</TabsContent>
        <TabsContent value="tab2">Conteúdo 2</TabsContent>
      </Tabs>
    )
    expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument()
    expect(screen.getByText('Conteúdo 1')).toBeInTheDocument()
  })

  it('troca conteúdo ao clicar em tab', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Conteúdo 1</TabsContent>
        <TabsContent value="tab2">Conteúdo 2</TabsContent>
      </Tabs>
    )

    await user.click(screen.getByRole('tab', { name: /tab 2/i }))

    expect(screen.getByText('Conteúdo 2')).toBeInTheDocument()
  })
})
