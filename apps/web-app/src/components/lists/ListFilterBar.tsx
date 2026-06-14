import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { listFilterCardClass } from './listStyles'

interface ListFilterBarProps {
  children: React.ReactNode
  className?: string
  /** Quando false, renderiza só o grid interno (útil dentro de outro Card). */
  bordered?: boolean
}

/** Filtros padronizados: card com padding e grid responsivo. */
export function ListFilterBar({ children, className, bordered = true }: ListFilterBarProps) {
  const grid = (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>{children}</div>
  )

  if (!bordered) return grid

  return (
    <Card className={listFilterCardClass}>
      <CardContent className="pt-5">{grid}</CardContent>
    </Card>
  )
}
