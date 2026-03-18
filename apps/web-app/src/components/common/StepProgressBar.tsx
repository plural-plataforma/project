import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface Step {
  label: string
  description?: string
}

interface StepProgressBarProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepProgressBar({ steps, currentStep, className }: StepProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative flex items-center justify-between mb-2">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-primary origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: currentStep / (steps.length - 1) }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ width: '100%' }}
        />

        {steps.map((step, index) => {
          const isDone = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={step.label} className="relative flex flex-col items-center z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isDone ? '#276678' : isCurrent ? '#276678' : '#e2e8f0',
                }}
                transition={{ duration: 0.25 }}
                className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
              >
                {isDone ? (
                  <Check size={14} weight="bold" className="text-white" />
                ) : (
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isCurrent ? 'text-white' : 'text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep
          const isDone = index < currentStep

          return (
            <span
              key={step.label}
              className={cn(
                'text-xs font-semibold transition-colors hidden sm:block',
                isCurrent ? 'text-primary' : isDone ? 'text-primary/60' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
