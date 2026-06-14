import { ClockCounterClockwise } from '@phosphor-icons/react'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/common/SkeletonCard'
import { cn } from '@/lib/utils'
import { historyTimelineItemClass, historyTimelineLineClass, listCardClass } from './listStyles'
import type { VariantProps } from 'class-variance-authority'

export type HistoryTimelineKind = 'activity' | 'observation' | 'default'

export interface HistoryTimelineBadge {
  label: string
  variant?: VariantProps<typeof badgeVariants>['variant']
}

export interface HistoryTimelineEntry {
  id: string | number
  kind?: HistoryTimelineKind
  occurredAt: string
  primary: string
  secondary?: string
  detail?: string
  badge?: HistoryTimelineBadge
}

interface HistoryTimelinePanelProps {
  title?: string
  icon?: React.ReactNode
  entries: HistoryTimelineEntry[]
  emptyMessage?: string
  isLoading?: boolean
  isRefreshing?: boolean
  maxItems?: number
  className?: string
}

function formatOccurredAt(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dotClass(kind: HistoryTimelineKind): string {
  if (kind === 'observation') return 'bg-brand-purple'
  if (kind === 'activity') return 'bg-amber'
  return 'bg-primary'
}

function HistoryTimelineItem({
  entry,
  showLine,
}: {
  entry: HistoryTimelineEntry
  showLine: boolean
}) {
  const kind = entry.kind ?? 'default'

  return (
    <li className="relative pl-6 pb-4 last:pb-0">
      {showLine ? <span className={historyTimelineLineClass} aria-hidden /> : null}
      <span
        className={cn(
          'absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm',
          dotClass(kind)
        )}
        aria-hidden
      />
      <article className={historyTimelineItemClass}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{entry.primary}</p>
            {entry.secondary ? (
              <p className="text-xs text-muted-foreground leading-snug">{entry.secondary}</p>
            ) : null}
          </div>
          <time
            dateTime={entry.occurredAt}
            className="text-[11px] text-brand-purple/80 tabular-nums shrink-0"
          >
            {formatOccurredAt(entry.occurredAt)}
          </time>
        </div>
        {entry.badge ? (
          <Badge variant={entry.badge.variant ?? 'muted'} className="mt-1">
            {entry.badge.label}
          </Badge>
        ) : null}
        {entry.detail ? (
          <p className="text-xs text-foreground leading-relaxed pt-1 border-t border-border/50 mt-2">
            {entry.detail}
          </p>
        ) : null}
      </article>
    </li>
  )
}

/** Painel padronizado de histórico/auditoria com timeline vertical. */
export function HistoryTimelinePanel({
  title = 'Histórico',
  icon,
  entries,
  emptyMessage = 'Ainda não há registros no histórico.',
  isLoading = false,
  isRefreshing = false,
  maxItems,
  className,
}: HistoryTimelinePanelProps) {
  const visible = maxItems ? entries.slice(0, maxItems) : entries
  const hiddenCount = maxItems ? Math.max(0, entries.length - maxItems) : 0

  return (
    <Card className={cn(listCardClass('default'), 'p-0 overflow-hidden', className)}>
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon ?? <ClockCounterClockwise size={18} className="text-brand-purple" />}
          {title}
          {isRefreshing && !isLoading ? (
            <span className="text-xs font-normal text-muted-foreground">Atualizando…</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>
        ) : (
          <>
            <ul className="relative" aria-label={title}>
              {visible.map((entry, index) => (
                <HistoryTimelineItem
                  key={entry.id}
                  entry={entry}
                  showLine={index < visible.length - 1}
                />
              ))}
            </ul>
            {hiddenCount > 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-3">
                + {hiddenCount} registro{hiddenCount !== 1 ? 's' : ''} mais antigo
                {hiddenCount !== 1 ? 's' : ''}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
