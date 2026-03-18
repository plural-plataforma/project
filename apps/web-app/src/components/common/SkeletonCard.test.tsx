import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton, SkeletonCard, SkeletonList } from './SkeletonCard'

describe('SkeletonCard', () => {
  describe('Skeleton', () => {
    it('renderiza div com classe skeleton', () => {
      const { container } = render(<Skeleton />)
      const el = container.firstChild as HTMLElement
      expect(el).toHaveClass('skeleton')
      expect(el).toHaveClass('rounded-lg')
    })

    it('aplica className customizada', () => {
      const { container } = render(<Skeleton className="h-5 w-10" />)
      const el = container.firstChild as HTMLElement
      expect(el).toHaveClass('h-5')
      expect(el).toHaveClass('w-10')
    })
  })

  describe('SkeletonCard', () => {
    it('renderiza card com múltiplos skeletons', () => {
      const { container } = render(<SkeletonCard />)
      const skeletons = container.querySelectorAll('.skeleton')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('SkeletonList', () => {
    it('renderiza count cards por padrão (3)', () => {
      const { container } = render(<SkeletonList />)
      const cards = container.querySelectorAll('.rounded-xl.border')
      expect(cards).toHaveLength(3)
    })

    it('renderiza count customizado', () => {
      const { container } = render(<SkeletonList count={5} />)
      const cards = container.querySelectorAll('.rounded-xl.border')
      expect(cards).toHaveLength(5)
    })
  })
})
