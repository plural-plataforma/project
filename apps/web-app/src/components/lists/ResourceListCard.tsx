import { Card } from '@/components/ui/card'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  listActionsClass,
  listCardClass,
  listCardHighlightClasses,
  listIconBoxClass,
  listMetaRowClass,
  listSubtitleClass,
} from './listStyles'
import type { VariantProps } from 'class-variance-authority'

export type ResourceListHighlight = keyof typeof listCardHighlightClasses

export interface ResourceListBadge {
  label: string
  variant?: VariantProps<typeof badgeVariants>['variant']
}

export interface ResourceListCardProps {
  icon?: React.ReactNode
  leading?: React.ReactNode
  title: string
  badges?: ResourceListBadge[]
  subtitle?: React.ReactNode
  meta?: React.ReactNode
  metaBadges?: ResourceListBadge[]
  highlight?: ResourceListHighlight
  actions?: React.ReactNode
  className?: string
  contentClassName?: string
  onClick?: () => void
}

export function ResourceListCard({
  icon,
  leading,
  title,
  badges = [],
  subtitle,
  meta,
  metaBadges = [],
  highlight = 'default',
  actions,
  className,
  contentClassName,
  onClick,
}: ResourceListCardProps) {
  const leadingNode =
    leading ??
    (icon ? (
      <div className={listIconBoxClass(highlight)} aria-hidden>
        {icon}
      </div>
    ) : null)

  const inner = (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start',
        onClick && 'cursor-pointer',
        contentClassName
      )}
    >
      <div className="flex flex-1 min-w-0 gap-3">
        {leadingNode}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground truncate text-base">{title}</h3>
            {badges.map((badge) => (
              <Badge key={badge.label} variant={badge.variant ?? 'default'}>
                {badge.label}
              </Badge>
            ))}
          </div>
          {subtitle ? <div className={listSubtitleClass}>{subtitle}</div> : null}
          {meta ? <div className={listMetaRowClass}>{meta}</div> : null}
          {metaBadges.length > 0 ? (
            <div className="flex gap-2 mt-2 flex-wrap">
              {metaBadges.map((badge) => (
                <Badge key={badge.label} variant={badge.variant ?? 'muted'}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {actions ? <div className={listActionsClass}>{actions}</div> : null}
    </div>
  )

  return (
    <Card
      className={cn(listCardClass(highlight), className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {inner}
    </Card>
  )
}
