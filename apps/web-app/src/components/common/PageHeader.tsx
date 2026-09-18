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
    // No mobile as ações descem para baixo do título. No desktop elas encolhem e quebram em
    // linhas quando faltar espaço: com shrink-0, grupos de vários botões (ex.: Baixar PDF/Word
    // + Duplicar + Reabrir) espremiam o título até ele quebrar letra a letra.
    <div className={cn('flex items-start justify-between gap-4 mb-6 max-sm:flex-col max-sm:gap-3', className)}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
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
        <div className="min-w-0">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-1.5 h-8 w-0.5 shrink-0 rounded-full bg-brand-purple"
              aria-hidden
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-foreground leading-tight break-words">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {action && (
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-0 max-sm:w-full">{action}</div>
      )}
    </div>
  )
}
