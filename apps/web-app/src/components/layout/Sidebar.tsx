import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  House,
  Buildings,
  Users,
  BookOpen,
  ClipboardText,
  Article,
  Notebook,
  SignOut,
  List,
  X,
  Compass,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useTheme } from '@/hooks/useTheme'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PEDAGOGICAL_FLOW_STEPS, DOCUMENTACAO_PEDAGOGICA_NAV, BIBLIOTECA_MODELOS_NAV, type PedagogicalFlowStepId } from '@/config/pedagogicalFlow'
import { Files, BookBookmark } from '@phosphor-icons/react'
import { useTourStore } from '@/stores/tourStore'
import { startProductTour } from '@/lib/productTour'

const FLOW_ICONS: Record<PedagogicalFlowStepId, Icon> = {
  escola: Buildings,
  aluno: Users,
  'estudo-caso': Article,
  avaliacao: ClipboardText,
  paee: BookOpen,
  relatos: Notebook,
}

const navItems = [
  { to: '/dashboard', icon: House, label: 'Início', activePathPrefix: '/dashboard' },
  ...PEDAGOGICAL_FLOW_STEPS.map((step) => ({
    to: step.route,
    icon: FLOW_ICONS[step.id],
    label: step.label,
    activePathPrefix: step.activePathPrefix ?? step.route,
  })),
  {
    to: DOCUMENTACAO_PEDAGOGICA_NAV.route,
    icon: Files,
    label: DOCUMENTACAO_PEDAGOGICA_NAV.label,
    activePathPrefix: DOCUMENTACAO_PEDAGOGICA_NAV.activePathPrefix,
  },
  {
    to: BIBLIOTECA_MODELOS_NAV.route,
    icon: BookBookmark,
    label: BIBLIOTECA_MODELOS_NAV.label,
    activePathPrefix: BIBLIOTECA_MODELOS_NAV.activePathPrefix,
  },
]

function isNavItemActive(pathname: string, to: string, activePathPrefix?: string): boolean {
  if (to === '/dashboard') return pathname === '/dashboard'
  const prefix = activePathPrefix ?? to
  return pathname === to || pathname.startsWith(`${prefix}/`)
}

interface SidebarProps {
  professorNome?: string
}

export function Sidebar({ professorNome }: SidebarProps) {
  const { signOut, logoutLoading } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const setHasSeenTour = useTourStore((state) => state.setHasSeenTour)
  useTheme()

  const handleStartTour = () => {
    setMobileOpen(false)
    startProductTour(() => setHasSeenTour(true))
  }

  const initials = professorNome
    ? professorNome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const NavContent = ({ withTourAnchors = false }: { withTourAnchors?: boolean }) => {
    const { pathname } = useLocation()

    return (
    <nav className="flex flex-col h-full">
      <NavLink
        id={withTourAnchors ? 'tour-sidebar-brand' : undefined}
        to="/dashboard"
        className="flex items-center gap-2.5 px-4 py-4 border-b border-border hover:bg-primary-light transition-colors duration-150"
        aria-label="Ir para o dashboard"
      >
        <img src="/favicon.png" alt="" aria-hidden className="h-7 w-7 object-contain shrink-0" />
        <div className="leading-none">
          <span className="text-primary font-black text-base tracking-tight block">Plural</span>
          <span className="text-brand-purple text-[8px] font-semibold tracking-widest uppercase">Plataforma</span>
        </div>
      </NavLink>

      <div id={withTourAnchors ? 'tour-sidebar-nav' : undefined} className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, activePathPrefix }) => {
          const active = isNavItemActive(pathname, to, activePathPrefix)
          return (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150',
                isActive || active
                  ? 'bg-primary text-white shadow-sm border-l-[1.5px] border-l-brand-purple'
                  : 'text-muted-foreground hover:bg-primary-light hover:text-primary'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  weight="duotone"
                  className={cn((isActive || active) && 'text-amber')}
                />
                {label}
              </>
            )}
          </NavLink>
          )
        })}
      </div>

      <div id={withTourAnchors ? 'tour-sidebar-profile' : undefined} className="border-t border-border p-3 space-y-1">
        <NavLink
          to="/perfil"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 w-full',
              isActive
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-primary-light hover:text-primary'
            )
          }
        >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate max-w-[120px]">{professorNome || 'Perfil'}</span>
        </NavLink>

        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs text-muted-foreground font-medium">Tema</span>
          <ThemeToggle />
        </div>

        {withTourAnchors && (
          <button
            onClick={handleStartTour}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-primary-light hover:text-primary transition-all duration-150 w-full cursor-pointer"
          >
            <Compass size={20} />
            Fazer tour
          </button>
        )}

        <button
          onClick={handleSignOut}
          disabled={logoutLoading}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-danger-light hover:text-danger transition-all duration-150 w-full cursor-pointer disabled:opacity-50"
        >
          {logoutLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <SignOut size={20} />
          )}
          Sair
        </button>

        <p className="px-3 pt-1 text-[10px] font-mono text-brand-purple/60 tabular-nums">
          v{__APP_VERSION__}
        </p>
      </div>
    </nav>
    )
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
        <NavContent withTourAnchors />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2" aria-label="Ir para o dashboard">
          <img src="/favicon.png" alt="" aria-hidden className="h-6 w-6 object-contain" />
          <span className="text-primary font-black text-base tracking-tight">Plural</span>
        </NavLink>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <List size={22} />
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
              <NavContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
