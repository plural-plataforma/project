import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function scrollInputIntoView(el: HTMLInputElement) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 300)
  })
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, id, onFocus, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const mergedRef = React.useCallback(
      (el: HTMLInputElement | null) => {
        if (typeof ref === 'function') ref(el)
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
      },
      [ref]
    )

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e)
        scrollInputIntoView(e.target)
      },
      [onFocus]
    )

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base',
              'placeholder:text-placeholder',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',
              error && 'border-danger focus:ring-danger',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={mergedRef}
            onFocus={handleFocus}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
