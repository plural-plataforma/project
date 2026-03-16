import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Buildings,
  Users,
  BookOpen,
  CheckCircle,
  LockSimple,
  ArrowRight,
  Sparkle,
  SmileyWink,
  WarningCircle,
} from '@phosphor-icons/react'
import { buscarProfessor, buscarEscolasProfessor, isCadastroCompleto } from '@/services/professorService'
import { buscarAlunos } from '@/services/alunoService'
import { buscarPlanejamento } from '@/services/planejamentoService'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type JourneyStatus = 'done' | 'current' | 'pending'

interface JourneyStep {
  id: 'escola' | 'alunos' | 'pdi'
  title: string
  description: string
  ctaLabel: string
  ctaDoneLabel: string
  route: string
  status: JourneyStatus
  icon: React.ElementType
  disabledReason?: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const previousCountsRef = useRef<{ escolas: number; alunos: number; planejamentos: number } | null>(null)
  const [journeyFeedback, setJourneyFeedback] = useState<string | null>(null)

  const { data: professorData, isLoading: loadingProf } = useQuery({
    queryKey: ['professor'],
    queryFn: buscarProfessor,
  })

  const { data: escolas = [], isLoading: loadingEscolas } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })

  const { data: alunos = [], isLoading: loadingAlunos } = useQuery({
    queryKey: ['alunos'],
    queryFn: buscarAlunos,
  })

  const { data: planejamentos = [], isLoading: loadingPlan } = useQuery({
    queryKey: ['planejamentos'],
    queryFn: buscarPlanejamento,
  })

  const isLoading = loadingProf || loadingEscolas || loadingAlunos || loadingPlan

  const professorNome = professorData?.objeto?.nomeCompleto?.split(' ')[0] ?? 'Professor'
  const cadastroCompleto = professorData?.objeto ? isCadastroCompleto(professorData.objeto, escolas.length) : false
  const hasEscolas = escolas.length > 0
  const hasAlunos = alunos.length > 0
  const hasPlanejamentos = planejamentos.length > 0
  const completedSteps = [hasEscolas, hasAlunos, hasPlanejamentos].filter(Boolean).length

  useEffect(() => {
    if (isLoading) return

    const currentCounts = {
      escolas: escolas.length,
      alunos: alunos.length,
      planejamentos: planejamentos.length,
    }

    if (previousCountsRef.current) {
      if (previousCountsRef.current.escolas === 0 && currentCounts.escolas > 0) {
        setJourneyFeedback('Etapa concluída: escola cadastrada. Próximo passo: cadastrar alunos.')
      } else if (previousCountsRef.current.alunos === 0 && currentCounts.alunos > 0) {
        setJourneyFeedback('Etapa concluída: aluno cadastrado. Próximo passo: criar PDI.')
      } else if (previousCountsRef.current.planejamentos === 0 && currentCounts.planejamentos > 0) {
        setJourneyFeedback('Parabéns! Você concluiu a configuração inicial da plataforma.')
      }
    }

    previousCountsRef.current = currentCounts
  }, [alunos.length, escolas.length, isLoading, planejamentos.length])

  const journeySteps = useMemo<JourneyStep[]>(() => {
    const escolaStatus: JourneyStatus = hasEscolas ? 'done' : 'current'
    const alunosStatus: JourneyStatus = hasAlunos ? 'done' : hasEscolas ? 'current' : 'pending'
    const pdiStatus: JourneyStatus = hasPlanejamentos ? 'done' : hasAlunos ? 'current' : 'pending'

    return [
      {
        id: 'escola',
        title: 'Cadastrar escola',
        description: 'Vincule a escola onde você atua. Isso desbloqueia o restante da jornada.',
        ctaLabel: 'Cadastrar escola',
        ctaDoneLabel: 'Ver escolas',
        route: '/escolas',
        status: escolaStatus,
        icon: Buildings,
      },
      {
        id: 'alunos',
        title: 'Cadastrar alunos',
        description: 'Adicione seus alunos para iniciar atendimentos e criar planejamentos.',
        ctaLabel: 'Cadastrar alunos',
        ctaDoneLabel: 'Ver alunos',
        route: '/alunos',
        status: alunosStatus,
        icon: Users,
        disabledReason: 'Disponível após cadastrar ao menos uma escola.',
      },
      {
        id: 'pdi',
        title: 'Criar PDI',
        description: 'Monte o Plano de Desenvolvimento Individual e acompanhe a evolução.',
        ctaLabel: 'Criar PDI',
        ctaDoneLabel: 'Ver PDIs',
        route: '/planejamentos',
        status: pdiStatus,
        icon: BookOpen,
        disabledReason: 'Disponível após cadastrar ao menos um aluno.',
      },
    ]
  }, [hasEscolas, hasAlunos, hasPlanejamentos])

  const progressPercent = (completedSteps / 3) * 100
  const isAllDone = completedSteps === 3

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-36 rounded-2xl" />
        <SkeletonList count={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!cadastroCompleto && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-amber/40 bg-amber-light p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <WarningCircle size={18} className="text-amber-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">Perfil incompleto</p>
                <p className="text-sm text-muted-foreground">
                  Finalize seu cadastro para liberar todos os recursos da plataforma.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate('/perfil')}>
              Completar perfil
            </Button>
          </div>
        </motion.div>
      )}

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl bg-primary p-6 md:p-8"
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SmileyWink size={20} className="text-amber" weight="fill" />
                <span className="text-white/70 text-sm font-medium">Olá, {professorNome}!</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {isAllDone
                  ? 'Configuração completa!'
                  : 'Vamos configurar sua conta'}
              </h1>
              <p className="text-white/70 mt-2 text-sm leading-relaxed max-w-md">
                {isAllDone
                  ? 'Você completou todos os passos iniciais. Explore todos os módulos da plataforma.'
                  : 'Complete os passos abaixo para desbloquear todas as funcionalidades da plataforma.'}
              </p>
            </div>

            {isAllDone && (
              <div className="flex items-center gap-2 bg-amber/20 rounded-xl px-4 py-3 border border-amber/30">
                <Sparkle size={20} className="text-amber" weight="fill" />
                <span className="text-amber font-bold text-sm">Tudo pronto!</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {!isAllDone && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span>{completedSteps} de 3 etapas concluídas</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Journey steps */}
      <div className="space-y-3">
        {journeyFeedback && (
          <div className="rounded-xl border border-success/30 bg-success-light p-4">
            <p className="text-sm font-semibold text-foreground">{journeyFeedback}</p>
          </div>
        )}
        {journeySteps.map((step, index) => (
          <JourneyStepCard
            key={step.id}
            step={step}
            index={index}
            onNavigate={() => navigate(step.route)}
          />
        ))}
      </div>

      {/* Quick stats (shown when setup is done) */}
      <AnimatePresence>
        {isAllDone && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: 'Escolas', value: escolas.length, route: '/escolas', icon: Buildings },
              { label: 'Alunos', value: alunos.length, route: '/alunos', icon: Users },
              { label: 'Planejamentos', value: planejamentos.length, route: '/planejamentos', icon: BookOpen },
            ].map(({ label, value, route, icon: Icon }) => (
              <button
                key={label}
                onClick={() => navigate(route)}
                className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-elevated transition-all duration-200 text-left cursor-pointer group"
              >
                <Icon size={20} className="text-primary group-hover:scale-110 transition-transform" weight="duotone" />
                <span className="text-2xl font-black text-foreground">{value}</span>
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface JourneyStepCardProps {
  step: JourneyStep
  index: number
  onNavigate: () => void
}

function JourneyStepCard({ step, index, onNavigate }: JourneyStepCardProps) {
  const { status, icon: Icon, title, description, ctaLabel, ctaDoneLabel, disabledReason } = step
  const isDone = status === 'done'
  const isCurrent = status === 'current'
  const isPending = status === 'pending'

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        'rounded-xl border p-5 transition-all duration-200',
        isDone && 'border-success/30 bg-success-light',
        isCurrent && 'border-primary bg-card shadow-elevated',
        isPending && 'border-border bg-card opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Step icon */}
          <div
            className={cn(
              'shrink-0 h-10 w-10 rounded-xl flex items-center justify-center',
              isDone && 'bg-success/10',
              isCurrent && 'bg-primary-light',
              isPending && 'bg-muted'
            )}
          >
            {isDone ? (
              <CheckCircle size={20} className="text-success" weight="fill" />
            ) : (
              <Icon
                size={20}
                className={cn(isCurrent ? 'text-primary' : 'text-muted-foreground')}
                weight="duotone"
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-foreground">{title}</h3>
              <Badge
                variant={isDone ? 'success' : isCurrent ? 'default' : 'muted'}
                className="text-xs"
              >
                {isDone ? 'Concluído' : isCurrent ? 'Próxima ação' : 'Pendente'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            {isPending && disabledReason && (
              <div className="flex items-center gap-1.5 mt-2">
                <LockSimple size={12} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{disabledReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        {!isPending && (
          <Button
            variant={isDone ? 'outline' : 'default'}
            size="sm"
            onClick={onNavigate}
            className="shrink-0"
          >
            {isDone ? ctaDoneLabel : ctaLabel}
            <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
