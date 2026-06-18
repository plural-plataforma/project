import { cn } from '@/lib/utils'
import { listResultToolbarClass } from './listStyles'

interface ListResultToolbarProps {
  count: number
  /** Singular: "aluno", "escola", "PAEE" */
  noun: string
  /** Plural opcional; default = noun + "s" */
  nounPlural?: string
  trailing?: React.ReactNode
  className?: string
}

/** Contador padronizado acima das listas. */
export function ListResultToolbar({
  count,
  noun,
  nounPlural,
  trailing,
  className,
}: ListResultToolbarProps) {
  const plural = nounPlural ?? `${noun}s`
  const label = count === 1 ? noun : plural

  return (
    <div className={cn(listResultToolbarClass, className)}>
      <p className="flex items-center gap-2">
        <span className="font-semibold text-brand-purple tabular-nums">{count}</span>
        <span>{label}</span>
      </p>
      {trailing}
    </div>
  )
}
