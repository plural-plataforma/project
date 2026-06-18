import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  backTo?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, backTo, action, className }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex items-start gap-3">
        {backTo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backTo)}
            className="mt-0.5 shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        <div>
          <div className="flex items-start gap-2.5">
            <span
              className="mt-1.5 h-8 w-0.5 shrink-0 rounded-full bg-brand-purple"
              aria-hidden
            />
            <div>
              <h1 className="text-2xl font-black text-foreground leading-tight">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
