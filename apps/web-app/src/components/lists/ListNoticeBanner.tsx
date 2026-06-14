import { cn } from '@/lib/utils'

interface ListNoticeBannerProps {
  icon?: React.ReactNode
  title: string
  children?: React.ReactNode
  variant?: 'amber' | 'default'
  className?: string
}

/** Banner informativo acima de listas (avisos, pendências). */
export function ListNoticeBanner({
  icon,
  title,
  children,
  variant = 'amber',
  className,
}: ListNoticeBannerProps) {
  const variantClass =
    variant === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
      : 'border-border bg-muted text-foreground'

  return (
    <div
      className={cn(
        'mb-4 flex items-start gap-3 rounded-xl border p-4 text-sm',
        variantClass,
        className
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div>
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-0.5 opacity-90">{children}</div> : null}
      </div>
    </div>
  )
}
