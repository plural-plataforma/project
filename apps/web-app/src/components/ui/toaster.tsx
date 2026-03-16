import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, WarningCircle, XCircle, X } from '@phosphor-icons/react'
import { useToastStore } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

const TOAST_DURATION = 4000

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  id: string
  title: string
  description?: string
  variant: 'default' | 'success' | 'danger' | 'warning'
  onDismiss: () => void
}

function ToastItem({ title, description, variant, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const iconMap = {
    success: <CheckCircle size={18} weight="fill" className="text-success shrink-0 mt-0.5" />,
    danger: <XCircle size={18} weight="fill" className="text-danger shrink-0 mt-0.5" />,
    warning: <WarningCircle size={18} weight="fill" className="text-warning shrink-0 mt-0.5" />,
    default: null,
  }

  const borderMap = {
    success: 'border-success/25 bg-success-light',
    danger: 'border-danger/25 bg-danger-light',
    warning: 'border-warning/25 bg-amber-light',
    default: 'border-border bg-card',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'relative flex items-start gap-3 rounded-xl border p-4 shadow-elevated',
        borderMap[variant]
      )}
      role="alert"
    >
      {iconMap[variant]}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fechar notificação"
      >
        <X size={14} weight="bold" />
      </button>
    </motion.div>
  )
}
