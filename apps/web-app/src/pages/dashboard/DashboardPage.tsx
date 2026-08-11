import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Buildings,
  Users,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Sparkle,
  SmileyWink,
  WarningCircle,
  Article,
  ClipboardText,
  Notebook,
  CalendarBlank,
  TrendUp,
  Lightning,
  ClockCounterClockwise,
  ChartPieSlice,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { buscarProfessor, buscarEscolasProfessor, isCadastroCompleto } from '@/services/professorService'
import { buscarAlunos } from '@/services/alunoService'
import { buscarPlanejamento } from '@/services/planejamentoService'
import { buscarAvaliacoesDiagnosticas } from '@/services/avaliacaoDiagnosticaService'
import { listarEstudosCaso } from '@/services/estudoCasoService'
import { listarRelatos } from '@/services/relatoAtendimentoService'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  PEDAGOGICAL_FLOW_STEPS,
  PEDAGOGICAL_FLOW_STEP_COUNT,
  type PedagogicalFlowStepId,
} from '@/config/pedagogicalFlow'
import { DashboardChartsPanel } from './DashboardChartsPanel'
import { useTourStore } from '@/stores/tourStore'
import { startProductTour } from '@/lib/productTour'
import {
  computeDashboardInsights,
  contextoEscolas,
  saudacaoPorHorario,
  type DashboardAlert,
  type DashboardMetric,
  type RecentActivityItem,
  formatMesReferencia,
} from '@/lib/dashboardInsights'

type JourneyStatus = 'done' | 'current' | 'available'

interface JourneyStep {
  id: PedagogicalFlowStepId
  title: string
  description: string
  ctaLabel: string
  ctaDoneLabel: string
  route: string
  status: JourneyStatus
  icon: Icon
}

const FLOW_ICONS: Record<PedagogicalFlowStepId, Icon> = {
  escola: Buildings,
  aluno: Users,
  'estudo-caso': Article,
  avaliacao: ClipboardText,
  paee: BookOpen,
  relatos: Notebook,
}

const RECENT_ICONS: Record<RecentActivityItem['kind'], Icon> = {
  relato: Notebook,
  estudo: Article,
  avaliacao: ClipboardText,
  paee: BookOpen,
}

const METRIC_ACCENT: Record<DashboardMetric['accent'], string> = {
  primary: 'border-primary/30 bg-primary/5',
  success: 'border-success/30 bg-success-light',
  amber: 'border-amber/40 bg-amber-light',
  violet: 'border-primary/25 bg-primary-light',
}

const ALERT_ACCENT: Record<DashboardAlert['tone'], string> = {
  info: 'border-border bg-muted/40',
  warning: 'border-amber/40 bg-amber-light',
  success: 'border-success/30 bg-success-light',
  primary: 'border-primary/30 bg-primary/5',
}

const COMPLETION_FEEDBACK: Partial<Record<PedagogicalFlowStepId, string>> = {
  escola: 'Etapa concluída: escola cadastrada. Próximo passo: cadastrar alunos.',
  aluno: 'Etapa concluída: aluno cadastrado. Próximo passo: elaborar estudo de caso.',
  'estudo-caso': 'Etapa concluída: estudo de caso registrado. Próximo passo: avaliação diagnóstica.',
  avaliacao: 'Etapa concluída: avaliação criada. Próximo passo: montar o PAEE.',
  paee: 'Etapa concluída: PAEE criado. Próximo passo: registrar atendimentos.',
  relatos: 'Parabéns! Você concluiu a jornada pedagógica inicial da plataforma.',
}

function ProgressRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-amber transition-all duration-700"
      />
    </svg>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const previousCompletionRef = useRef<Record<PedagogicalFlowStepId, boolean> | null>(null)
  const [journeyFeedback, setJourneyFeedback] = useState<string | null>(null)
  const hasSeenTour = useTourStore((state) => state.hasSeenTour)
  const setHasSeenTour = useTourStore((state) => state.setHasSeenTour)

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

  const { data: avaliacoes = [], isLoading: loadingAvaliacoes } = useQuery({
    queryKey: ['avaliacoes-diagnosticas'],
    queryFn: buscarAvaliacoesDiagnosticas,
  })

  const { data: estudosCaso = [], isLoading: loadingEstudos } = useQuery({
    queryKey: ['estudos-caso-lista'],
    queryFn: listarEstudosCaso,
  })

  const { data: relatos = [], isLoading: loadingRelatos } = useQuery({
    queryKey: ['relatos'],
    queryFn: () => listarRelatos(),
  })

  const isLoading =
    loadingProf ||
    loadingEscolas ||
    loadingAlunos ||
    loadingPlan ||
    loadingAvaliacoes ||
    loadingEstudos ||
    loadingRelatos

  const professorNome = professorData?.objeto?.nomeCompleto?.split(' ')[0] ?? 'Professora'
  const cadastroCompleto = professorData?.objeto ? isCadastroCompleto(professorData.objeto, escolas.length) : false

  const completionByStep = useMemo(
    (): Record<PedagogicalFlowStepId, boolean> => ({
      escola: escolas.length > 0,
      aluno: alunos.length > 0,
      'estudo-caso': estudosCaso.length > 0,
      avaliacao: avaliacoes.length > 0,
      paee: planejamentos.length > 0,
      relatos: relatos.length > 0,
    }),
    [
      alunos.length,
      avaliacoes.length,
      escolas.length,
      estudosCaso.length,
      planejamentos.length,
      relatos.length,
    ]
  )

  const insights = useMemo(
    () =>
      computeDashboardInsights({
        alunos,
        escolas,
        planejamentos,
        avaliacoes,
        estudosCaso,
        relatos,
        completionByStep,
      }),
    [alunos, avaliacoes, completionByStep, escolas, estudosCaso, planejamentos, relatos]
  )

  useEffect(() => {
    if (isLoading) return

    if (previousCompletionRef.current) {
      for (const step of PEDAGOGICAL_FLOW_STEPS) {
        const wasDone = previousCompletionRef.current[step.id]
        const isDone = completionByStep[step.id]
        if (!wasDone && isDone) {
          setJourneyFeedback(COMPLETION_FEEDBACK[step.id] ?? 'Etapa concluída.')
          break
        }
      }
    }

    previousCompletionRef.current = completionByStep
  }, [completionByStep, isLoading])

  useEffect(() => {
    if (isLoading || hasSeenTour) return
    if (window.innerWidth < 768) return

    const timer = setTimeout(() => {
      startProductTour(() => setHasSeenTour(true))
    }, 600)

    return () => clearTimeout(timer)
  }, [isLoading, hasSeenTour, setHasSeenTour])

  const journeySteps = useMemo<JourneyStep[]>(() => {
    const doneFlags = PEDAGOGICAL_FLOW_STEPS.map((s) => completionByStep[s.id])
    const firstIncompleteIndex = doneFlags.findIndex((done) => !done)

    return PEDAGOGICAL_FLOW_STEPS.map((step, index) => {
      const isDone = doneFlags[index]
      const isCurrent = !isDone && index === firstIncompleteIndex

      const status: JourneyStatus = isDone ? 'done' : isCurrent ? 'current' : 'available'

      return {
        id: step.id,
        title: step.journeyTitle,
        description: step.journeyDescription,
        ctaLabel: step.ctaLabel,
        ctaDoneLabel: step.ctaDoneLabel,
        route: step.route,
        status,
        icon: FLOW_ICONS[step.id],
      }
    })
  }, [completionByStep])

  const completedSteps = Object.values(completionByStep).filter(Boolean).length
  const progressPercent = (completedSteps / PEDAGOGICAL_FLOW_STEP_COUNT) * 100
  const isAllDone = completedSteps === PEDAGOGICAL_FLOW_STEP_COUNT
  const mesAtual = formatMesReferencia()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <SkeletonList count={4} />
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

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        id="tour-hero"
        className="relative overflow-hidden rounded-2xl bg-primary p-6 md:p-8"
      >
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-white/[0.03] blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SmileyWink size={20} className="text-amber" weight="fill" />
              <span className="text-white/70 text-sm font-medium">
                {saudacaoPorHorario()}, {professorNome}!
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {isAllDone ? 'Sua prática documentada em um só lugar' : 'Painel da sua prática pedagógica'}
            </h1>
            <p className="text-white/70 mt-2 text-sm leading-relaxed max-w-lg">
              {contextoEscolas(escolas)} · {mesAtual}. Os números abaixo refletem apenas os dados vinculados à
              sua conta.
            </p>
            {!isAllDone && (
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                  <span>
                    Jornada: {completedSteps}/{PEDAGOGICAL_FLOW_STEP_COUNT} etapas
                  </span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="relative flex items-center justify-center text-white">
              <ProgressRing percent={progressPercent} />
              <span className="absolute text-sm font-bold text-white">{Math.round(progressPercent)}%</span>
            </div>
            {isAllDone && (
              <div className="flex items-center gap-2 bg-amber/20 rounded-xl px-4 py-3 border border-amber/30">
                <Sparkle size={20} className="text-amber" weight="fill" />
                <span className="text-amber font-bold text-sm">Jornada completa</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Métricas */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        id="tour-metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {insights.metrics.map((metric) => (
          <button
            key={metric.id}
            type="button"
            onClick={() => navigate(metric.route)}
            className={cn(
              'group flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-200',
              'hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer',
              METRIC_ACCENT[metric.accent]
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <TrendUp
                size={18}
                className="text-primary opacity-80 group-hover:scale-110 transition-transform"
                weight="duotone"
              />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                {metric.label}
              </span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-foreground tabular-nums">{metric.value}</span>
            <span className="text-xs text-muted-foreground leading-snug line-clamp-2">{metric.hint}</span>
          </button>
        ))}
      </motion.div>

      <DashboardChartsPanel
        charts={insights.charts}
        coberturaPercent={insights.coberturaPercent}
        presencaMesPercent={insights.presencaMesPercent}
        totalAlunos={alunos.length}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna principal: jornada */}
        <div className="lg:col-span-2 space-y-4">
          {journeyFeedback && (
            <div className="rounded-xl border border-success/30 bg-success-light p-4">
              <p className="text-sm font-semibold text-foreground">{journeyFeedback}</p>
            </div>
          )}

          <Card id="tour-journey">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ChartPieSlice size={18} className="text-primary" weight="duotone" />
                Jornada pedagógica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {journeySteps.map((step, index) => (
                <JourneyStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  onNavigate={() => navigate(step.route)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: insights + atividade */}
        <div className="space-y-4">
          <Card id="tour-insights">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightning size={18} className="text-amber" weight="fill" />
                Insights para você
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {insights.alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Tudo em ordem por aqui. Continue registrando atendimentos e atualizando os planos.
                </p>
              ) : (
                insights.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn('rounded-lg border p-3 text-sm', ALERT_ACCENT[alert.tone])}
                  >
                    <p className="font-semibold text-foreground">{alert.title}</p>
                    <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{alert.description}</p>
                    {alert.route && alert.ctaLabel && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2 text-primary"
                        onClick={() => navigate(alert.route!)}
                      >
                        {alert.ctaLabel}
                        <ArrowRight size={12} />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card id="tour-recent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClockCounterClockwise size={18} className="text-primary" weight="duotone" />
                Atividade recente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {insights.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma movimentação registrada ainda. Use o menu lateral ou os atalhos da jornada para começar.
                </p>
              ) : (
                <ul className="space-y-2">
                  {insights.recent.map((item) => {
                    const Icon = RECENT_ICONS[item.kind]
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => navigate(item.route)}
                          className="w-full flex items-start gap-3 rounded-lg p-2.5 text-left hover:bg-muted/60 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                            <Icon size={16} className="text-primary" weight="duotone" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-1">
                            <CalendarBlank size={10} />
                            {item.dateLabel}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {insights.alunosSemEstudo.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alunos sem estudo de caso</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5">
                  {insights.alunosSemEstudo.slice(0, 5).map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline truncate block max-w-full text-left"
                        onClick={() => navigate(`/estudo-caso/nova/aluno?alunoId=${a.id}`)}
                      >
                        {a.nomeCompleto}
                      </button>
                    </li>
                  ))}
                </ul>
                {insights.alunosSemEstudo.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{insights.alunosSemEstudo.length - 5} aluno(s)
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

interface JourneyStepCardProps {
  step: JourneyStep
  index: number
  onNavigate: () => void
}

function JourneyStepCard({ step, index, onNavigate }: JourneyStepCardProps) {
  const { status, icon: Icon, title, description, ctaLabel, ctaDoneLabel } = step
  const isDone = status === 'done'
  const isCurrent = status === 'current'
  const isAvailable = status === 'available'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        isDone && 'border-success/30 bg-success-light/50',
        isCurrent && 'border-primary bg-card shadow-sm',
        isAvailable && 'border-border bg-card'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
              isDone && 'bg-success/10',
              isCurrent && 'bg-primary-light',
              isAvailable && 'bg-muted'
            )}
          >
            {isDone ? (
              <CheckCircle size={18} className="text-success" weight="fill" />
            ) : (
              <Icon
                size={18}
                className={cn(isCurrent ? 'text-primary' : 'text-muted-foreground')}
                weight="duotone"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-semibold text-sm text-foreground">{title}</h3>
              <Badge
                variant={isDone ? 'success' : isCurrent ? 'default' : 'muted'}
                className="text-[10px]"
              >
                {isDone ? 'Concluído' : isCurrent ? 'Sugestão' : 'Disponível'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <Button variant={isDone ? 'outline' : 'default'} size="sm" onClick={onNavigate} className="shrink-0 h-8 text-xs">
          {isDone ? ctaDoneLabel : ctaLabel}
          <ArrowRight size={12} />
        </Button>
      </div>
    </motion.div>
  )
}
