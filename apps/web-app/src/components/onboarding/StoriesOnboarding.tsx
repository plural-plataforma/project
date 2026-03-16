import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  ClipboardText,
  ChatsCircle,
  Clock,
  Heart,
  Sparkle,
  Users,
  ShieldCheck,
  NotePencil,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { cn } from '@/lib/utils'

const STORY_DURATION_MS = 5500

export interface StorySlide {
  id: string
  content: React.ReactNode
  background?: 'primary' | 'purple' | 'teal' | 'light' | 'gradient'
}

const slides: StorySlide[] = [
  {
    id: 'hero',
    background: 'gradient',
    content: (
      <div className="flex flex-col items-center justify-center text-center px-6 h-full">
        <div className="rounded-3xl overflow-hidden shadow-elevated mb-8">
          <img src="/splash-icon.png" alt="Plural Plataforma" className="w-36 h-36 object-cover" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-sm">
          Onde cada <span className="text-amber">aluno</span> importa.
          <br />
          Onde cada <span className="text-amber">progresso</span> conta.
        </h2>
      </div>
    ),
  },
  {
    id: 'revolucao',
    background: 'purple',
    content: (
      <div className="flex flex-col justify-center text-center px-6 h-full">
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
          Professora, essa é a revolução que o AEE estava esperando.
        </h2>
      </div>
    ),
  },
  {
    id: 'rotina',
    background: 'teal',
    content: (
      <div className="flex flex-col justify-center px-6 h-full">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Você conhece bem essa rotina:</h2>
        <ul className="space-y-3 text-white/95 text-sm md:text-base">
          {[
            'Registrar todos os avanços dos alunos.',
            'Preparar relatórios de progresso.',
            'Adaptar conteúdos para cada necessidade.',
            'Manter a comunicação com a família.',
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'por-voce',
    background: 'purple',
    content: (
      <div className="flex flex-col justify-center text-center px-6 h-full">
        <p className="text-white/90 text-base mb-4">É por você, sua rotina e seus alunos que existe a</p>
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
          Plural <span className="text-amber">PLATAFORMA</span>
        </h2>
      </div>
    ),
  },
  {
    id: 'aliada',
    background: 'teal',
    content: (
      <div className="flex flex-col justify-center text-center px-6 h-full">
        <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-4">
          Mas você não deveria carregar esse peso sozinha.
        </h2>
        <p className="text-white/90 text-base md:text-lg">
          A Plural nasceu para ser sua aliada: dar clareza, leveza e devolver tempo para o que realmente importa: o aluno.
        </p>
      </div>
    ),
  },
  {
    id: 'beneficios',
    background: 'teal',
    content: (
      <div className="flex flex-col justify-center px-6 h-full overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4 text-center shrink-0">O que a Plural faz por você</h2>
        <ul className="space-y-2.5 text-white/95 text-sm">
          {[
            { icon: Users, text: 'Centraliza todos os registros dos alunos em um só lugar.' },
            { icon: FileText, text: 'Gera relatórios de progresso de forma rápida e automática.' },
            { icon: ClipboardText, text: 'Cria planos de atendimento individualizado (PAI) com facilidade.' },
            { icon: NotePencil, text: 'Oferece modelos de atividades e adaptações prontas.' },
            { icon: ChatsCircle, text: 'Facilita a comunicação e o compartilhamento com a família.' },
            { icon: Clock, text: 'Economiza tempo e reduz a burocracia do dia a dia.' },
          ].map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3">
              <Icon size={20} weight="fill" className="text-amber shrink-0 mt-0.5" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'impacto',
    background: 'purple',
    content: (
      <div className="flex flex-col justify-center text-center px-6 h-full">
        <p className="text-white/90 text-base mb-4">Por que isso importa?</p>
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
          Porque inclusão só acontece porque você faz acontecer.
        </h2>
      </div>
    ),
  },
  {
    id: 'produto',
    background: 'teal',
    content: (
      <div className="flex flex-col justify-center text-center px-6 h-full">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-amber/20 p-3">
            <Heart size={32} weight="fill" className="text-amber" />
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-4">
          Exclusivo para professoras de AEE, feito com o coração e a inteligência de quem entende.
        </h2>
        <p className="text-white/90 text-base mb-4">
          Um espaço simples, intuitivo e pensado para o chão da escola.
        </p>
        <p className="text-white/80 text-sm">
          Se você já usa WhatsApp, vai conseguir usar sem dificuldade.
        </p>
      </div>
    ),
  },
  {
    id: 'seguranca-evolucao',
    background: 'purple',
    content: (
      <div className="flex flex-col justify-center px-6 h-full gap-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} weight="fill" className="text-amber shrink-0" />
          <div>
            <p className="font-bold text-white">Totalmente seguro</p>
            <p className="text-white/85 text-sm">Confidencialidade e proteção das informações pedagógicas.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Sparkle size={28} weight="fill" className="text-amber shrink-0" />
          <div>
            <p className="font-bold text-white">Em constante evolução</p>
            <p className="text-white/85 text-sm">Atualizações de acordo com as necessidades reais das professoras.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'quem-esta',
    background: 'teal',
    content: (
      <div className="flex flex-col justify-center text-center px-6 h-full">
        <h2 className="text-xl font-bold text-white mb-4">Quem está por trás da Plural</h2>
        <p className="text-white/90 text-base leading-relaxed">
          Feita por quem entende o AEE: idealizadoras que já movimentaram milhares em projetos educacionais e formaram uma comunidade de professoras. Chegam agora para entregar a ferramenta que faltava no AEE.
        </p>
      </div>
    ),
  },
  {
    id: 'cta',
    background: 'light',
    content: (
      <div className="flex flex-col justify-center items-center text-center px-6 h-full gap-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
          Bem-vinda à Plural!
        </h2>
        <p className="text-muted-foreground text-sm">
          Tudo em um ambiente simples, intuitivo e pensado para o chão da escola.
        </p>
      </div>
    ),
  },
]

const bgClasses: Record<NonNullable<StorySlide['background']>, string> = {
  primary: 'bg-primary',
  purple: 'bg-brand-purple',
  teal: 'bg-primary',
  light: 'bg-muted',
  gradient: 'bg-gradient-to-br from-primary via-primary to-[#1a4d5c]',
}

interface StoriesOnboardingProps {
  isLoggedIn?: boolean
}

export function StoriesOnboarding({ isLoggedIn: isLoggedInProp }: StoriesOnboardingProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn: isLoggedInFromAuth } = useAuth()
  const setHasSeenOnboarding = useOnboardingStore((s) => s.setHasSeenOnboarding)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const advancingRef = useRef(false)

  const isLoggedIn = isLoggedInProp ?? isLoggedInFromAuth
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)
  const isReviewMode = hasSeenOnboarding
  const destination = isLoggedIn
    ? ((location.state as { destination?: string } | null)?.destination ?? '/dashboard')
    : '/login'

  const slide = slides[currentIndex]
  const isLastSlide = currentIndex === slides.length - 1

  const goNext = useCallback(() => {
    if (isLastSlide) {
      if (!isReviewMode) setHasSeenOnboarding(true)
      navigate(isReviewMode ? '/login' : destination, { replace: true })
    } else {
      setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))
      setProgress(0)
    }
  }, [isLastSlide, navigate, setHasSeenOnboarding, destination, isReviewMode])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
    }
  }, [currentIndex])

  // Auto-advance timer — evita múltiplas chamadas de goNext (Strict Mode / race)
  useEffect(() => {
    advancingRef.current = false
    const timeoutId = setTimeout(() => setProgress(0), 0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (advancingRef.current) return p
        const step = (100 / STORY_DURATION_MS) * 50
        const next = p + step
        if (next >= 100) {
          advancingRef.current = true
          goNext()
          return 0
        }
        return next
      })
    }, 50)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [currentIndex, goNext])

  // Tap zones: left = prev, right = next
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const third = rect.width / 3
    if (x < third) {
      goPrev()
    } else {
      goNext()
    }
  }

  const handleFinish = () => {
    if (!isReviewMode) setHasSeenOnboarding(true)
    navigate(isReviewMode ? '/login' : destination, { replace: true })
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-background',
        'min-h-dvh h-dvh',
        'md:max-w-md md:mx-auto md:min-h-[min(90dvh,640px)] md:max-h-[min(90dvh,640px)] md:rounded-2xl md:shadow-elevated md:aspect-9/16'
      )}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur-sm">
        {slides.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
            role="progressbar"
            aria-valuenow={i < currentIndex ? 100 : i === currentIndex ? progress : 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                'h-full rounded-full bg-white transition-all duration-75',
                i < currentIndex && 'w-full',
                i === currentIndex && 'bg-white'
              )}
              style={i === currentIndex ? { width: `${progress}%` } : undefined}
            />
          </div>
        ))}
      </div>

      {/* Tap zones for navigation */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault()
            goNext()
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            goPrev()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Clique à esquerda para voltar, à direita para avançar"
      />

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            'absolute inset-0 flex flex-col',
            bgClasses[slide.background ?? 'primary']
          )}
        >
          {slide.content}
        </motion.div>
      </AnimatePresence>

      {/* CTA button on last slide — esconde "Entrar na plataforma" no modo rever */}
      {isLastSlide && !isReviewMode && (
        <div className="absolute bottom-8 left-0 right-0 z-20 px-6 flex flex-col gap-3 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <Button
            size="lg"
            className="w-full"
            onClick={handleFinish}
          >
            {isLoggedIn ? 'Ir para a plataforma' : 'Entrar na plataforma'}
          </Button>
          {!isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setHasSeenOnboarding(true)
                navigate('/cadastro', { replace: true })
              }}
            >
              Criar conta
            </Button>
          )}
        </div>
      )}
      {isLastSlide && isReviewMode && (
        <div className="absolute bottom-8 left-0 right-0 z-20 px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleFinish}
          >
            Voltar
          </Button>
        </div>
      )}
    </div>
  )
}
