import { cn } from '@/lib/utils'

/** Tokens visuais compartilhados entre listas de recursos (cards). */
export const LIST_STAGGER_MS = 40

export const listContainerClass = 'space-y-3'

export const listCardHighlightClasses = {
  default: 'hover:border-primary/60 hover:shadow-elevated',
  amber:
    'border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:shadow-elevated dark:border-amber-900/50 dark:bg-amber-950/20',
  none: 'hover:shadow-card',
} as const

export const listCardAccentClasses = {
  default: 'border-l-amber',
  amber: 'border-l-amber',
  none: 'border-l-border',
} as const

export const listIconBoxClasses = {
  default: 'bg-primary-light text-primary ring-1 ring-brand-purple/20',
  amber: 'bg-amber-100 text-amber-700 ring-1 ring-brand-purple/25 dark:bg-amber-900/40 dark:text-amber-400',
} as const

export function listCardClass(highlight: keyof typeof listCardHighlightClasses = 'default') {
  return cn(
    'p-5 border-l-4 shadow-card transition-all duration-200',
    listCardHighlightClasses[highlight],
    listCardAccentClasses[highlight]
  )
}

export function listIconBoxClass(highlight: keyof typeof listIconBoxClasses = 'default') {
  return cn(
    'h-11 w-11 rounded-xl flex items-center justify-center shrink-0',
    listIconBoxClasses[highlight]
  )
}

export const listSubtitleClass = 'text-sm text-muted-foreground mt-0.5'

export const listMetaRowClass =
  'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5'

export const listActionsClass =
  'flex flex-wrap items-center justify-end gap-2 shrink-0 max-sm:w-full max-sm:pt-2'

/** Botão ghost de ação destrutiva em linhas/cards de lista. */
export const listDangerIconButtonClass =
  'text-muted-foreground hover:text-danger shrink-0'

/** Linha compacta em listas embutidas (perfil, detalhe, documentação). */
export const mutedListRowClass =
  'flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-muted border border-border/60'

export const listFilterCardClass = 'mb-4 shadow-card border-t-2 border-t-brand-purple/35'

export const listResultToolbarClass =
  'flex items-center justify-between gap-2 mb-3 text-sm text-muted-foreground'

/** Container de item na timeline de histórico. */
export const historyTimelineItemClass =
  'rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 space-y-1'

/** Linha vertical entre pontos da timeline. */
export const historyTimelineLineClass = 'absolute left-[7px] top-3 bottom-0 w-px bg-brand-purple/25'
