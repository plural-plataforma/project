import { Sun, Moon, Monitor } from '@phosphor-icons/react'
import { useTheme } from '@/hooks/useTheme'
import { type ThemeMode } from '@/stores/themeStore'
import { cn } from '@/lib/utils'

const options: { mode: ThemeMode; icon: React.ElementType; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Claro' },
  { mode: 'dark', icon: Moon, label: 'Escuro' },
  { mode: 'system', icon: Monitor, label: 'Sistema' },
]

export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
      role="group"
      aria-label="Tema da interface"
    >
      {options.map(({ mode: m, icon: Icon, label }) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          title={label}
          aria-pressed={mode === m}
          className={cn(
            'flex items-center justify-center h-7 w-7 rounded-md transition-all duration-200 cursor-pointer',
            mode === m
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon size={14} weight={mode === m ? 'fill' : 'regular'} />
        </button>
      ))}
    </div>
  )
}
