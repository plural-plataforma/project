import { cn } from '@/lib/utils'
import { mutedListRowClass } from './listStyles'

interface MutedListRowProps {
  children: React.ReactNode
  className?: string
}

/** Linha compacta para listas embutidas (perfil do aluno, detalhes, documentação). */
export function MutedListRow({ children, className }: MutedListRowProps) {
  return <div className={cn(mutedListRowClass, className)}>{children}</div>
}
