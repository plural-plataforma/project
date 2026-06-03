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
  Article,
  ClipboardText,
  Notebook,
  Files,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { buscarProfessor, buscarEscolasProfessor, isCadastroCompleto } from '@/services/professorService'
import { buscarAlunos } from '@/services/alunoService'
import { buscarPlanejamento } from '@/services/planejamentoService'
import { buscarAvaliacoesDiagnosticas } from '@/services/avaliacaoDiagnosticaService'
import { listarEstudosCasoPorAluno } from '@/services/estudoCasoService'
import { listarRelatos } from '@/services/relatoAtendimentoService'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  PEDAGOGICAL_FLOW_STEPS,
  PEDAGOGICAL_FLOW_STEP_COUNT,
  DOCUMENTACAO_PEDAGOGICA_NAV,
  type PedagogicalFlowStepId,
} from '@/config/pedagogicalFlow'
import { contarFusoesEstudoPaeeDisponiveis } from '@/pages/documentacao/DocumentacaoPedagogicaPage'

type JourneyStatus = 'done' | 'current' | 'pending'

interface JourneyStep {
  id: PedagogicalFlowStepId
  title: string
  description: string
  ctaLabel: string
  ctaDoneLabel: string
  route: string
  status: JourneyStatus
  icon: Icon
  disabledReason?: string
}

const FLOW_ICONS: Record<PedagogicalFlowStepId, Icon> = {
  escola: Buildings,
  aluno: Users,
  'estudo-caso': Article,
  avaliacao: ClipboardText,
  paee: BookOpen,
  relatos: Notebook,
}

const COMPLETION_FEEDBACK: Partial<Record<PedagogicalFlowStepId, string>> = {
  escola: 'Etapa concluída: escola cadastrada. Próximo passo: cadastrar alunos.',
  aluno: 'Etapa concluída: aluno cadastrado. Próximo passo: elaborar estudo de caso.',
  'estudo-caso': 'Etapa concluída: estudo de caso registrado. Próximo passo: avaliação diagnóstica.',
  avaliacao: 'Etapa concluída: avaliação criada. Próximo passo: montar o PAEE.',
  paee: 'Etapa concluída: PAEE criado. Próximo passo: registrar atendimentos.',
  relatos: 'Parabéns! Você concluiu a jornada pedagógica inicial da plataforma.',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const previousCompletionRef = useRef<Record<PedagogicalFlowStepId, boolean> | null>(null)
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

  const { data: avaliacoes = [], isLoading: loadingAvaliacoes } = useQuery({
    queryKey: ['avaliacoes-diagnosticas'],
    queryFn: buscarAvaliacoesDiagnosticas,
  })

  const { data: totalEstudosCaso = 0, isLoading: loadingEstudos } = useQuery({
    queryKey: ['estudos-caso-total', alunos.map((a) => a.id).join(',')],
    queryFn: async () => {
      const ids = alunos.map((a) => a.id).filter((id): id is number => id != null)
      if (ids.length === 0) return 0
      const listas = await Promise.all(ids.map((id) => listarEstudosCasoPorAluno(id)))
      return listas.reduce((acc, lista) => acc + lista.length, 0)
    },
    enabled: alunos.length > 0,
  })

  const { data: totalRelatos = 0, isLoading: loadingRelatos } = useQuery({
    queryKey: ['relatos-total'],
    queryFn: async () => {
      const lista = await listarRelatos()
      return lista.length
    },
  })

  const { data: totalFusoes = 0, isLoading: loadingFusoes } = useQuery({
    queryKey: ['documentacao-pedagogica-count', alunos.map((a) => a.id).join(',')],
    queryFn: contarFusoesEstudoPaeeDisponiveis,
    enabled: alunos.length > 0 && planejamentos.length > 0,
  })

  const isLoading =
    loadingProf ||
    loadingEscolas ||
    loadingAlunos ||
    loadingPlan ||
    loadingAvaliacoes ||
    loadingEstudos ||
    loadingRelatos ||
    loadingFusoes

  const professorNome = professorData?.objeto?.nomeCompleto?.split(' ')[0] ?? 'Professor'
  const cadastroCompleto = professorData?.objeto ? isCadastroCompleto(professorData.objeto, escolas.length) : false

  const completionByStep = useMemo(
    (): Record<PedagogicalFlowStepId, boolean> => ({
      escola: escolas.length > 0,
      aluno: alunos.length > 0,
      'estudo-caso': totalEstudosCaso > 0,
      avaliacao: avaliacoes.length > 0,
      paee: planejamentos.length > 0,
      relatos: totalRelatos > 0,
    }),
    [alunos.length, avaliacoes.length, escolas.length, planejamentos.length, totalEstudosCaso, totalRelatos]
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

  const journeySteps = useMemo<JourneyStep[]>(() => {
    const doneFlags = PEDAGOGICAL_FLOW_STEPS.map((s) => completionByStep[s.id])
    const firstIncompleteIndex = doneFlags.findIndex((done) => !done)

    return PEDAGOGICAL_FLOW_STEPS.map((step, index) => {
      const isDone = doneFlags[index]
      const isCurrent = !isDone && (index === firstIncompleteIndex || firstIncompleteIndex === -1)
      const isPending = !isDone && index > firstIncompleteIndex && firstIncompleteIndex !== -1

      let status: JourneyStatus = 'pending'
      if (isDone) status = 'done'
      else if (isCurrent) status = 'current'
      else if (isPending) status = 'pending'

      return {
        id: step.id,
        title: step.journeyTitle,
        description: step.journeyDescription,
        ctaLabel: step.ctaLabel,
        ctaDoneLabel: step.ctaDoneLabel,
        route: step.route,
        status,
        icon: FLOW_ICONS[step.id],
        disabledReason: status === 'pending' ? step.pendingReason : undefined,
      }
    })
  }, [completionByStep])

  const completedSteps = Object.values(completionByStep).filter(Boolean).length
  const progressPercent = (completedSteps / PEDAGOGICAL_FLOW_STEP_COUNT) * 100
  const isAllDone = completedSteps === PEDAGOGICAL_FLOW_STEP_COUNT

  const quickStats = useMemo(
    () => [
      { label: 'Escolas', value: escolas.length, route: '/escolas', icon: Buildings },
      { label: 'Alunos', value: alunos.length, route: '/alunos', icon: Users },
      { label: 'Estudos de caso', value: totalEstudosCaso, route: '/estudo-caso', icon: Article },
      { label: 'Avaliações', value: avaliacoes.length, route: '/avaliacoes', icon: ClipboardText },
      { label: 'PAEE', value: planejamentos.length, route: '/planejamentos', icon: BookOpen },
      { label: 'Registro de atendimento', value: totalRelatos, route: '/relatos', icon: Notebook },
    ],
    [alunos.length, avaliacoes.length, escolas.length, planejamentos.length, totalEstudosCaso, totalRelatos]
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-36 rounded-2xl" />
        <SkeletonList count={6} />
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl bg-primary p-6 md:p-8"
      >
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
                {isAllDone ? 'Jornada pedagógica completa!' : 'Sua jornada na plataforma'}
              </h1>
              <p className="text-white/70 mt-2 text-sm leading-relaxed max-w-md">
                {isAllDone
                  ? 'Você percorreu todas as etapas: escola, aluno, estudo de caso, avaliação, PAEE e registro de atendimento.'
                  : 'Siga a ordem recomendada — a mesma do menu — para documentar o atendimento com fluidez.'}
              </p>
            </div>

            {isAllDone && (
              <div className="flex items-center gap-2 bg-amber/20 rounded-xl px-4 py-3 border border-amber/30">
                <Sparkle size={20} className="text-amber" weight="fill" />
                <span className="text-amber font-bold text-sm">Tudo pronto!</span>
              </div>
            )}
          </div>

          {!isAllDone && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span>
                  {completedSteps} de {PEDAGOGICAL_FLOW_STEP_COUNT} etapas concluídas
                </span>
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

      {totalFusoes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Files size={22} className="text-primary" weight="duotone" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Estudo de caso + PAEE</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalFusoes} aluno{totalFusoes !== 1 ? 's' : ''} com documentação pedagógica completa. Baixe o
                  pacote consolidado.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(DOCUMENTACAO_PEDAGOGICA_NAV.route)}>
              Baixar documentação
              <ArrowRight size={14} />
            </Button>
          </div>
        </motion.div>
      )}

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

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          {quickStats.map(({ label, value, route, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(route)}
              className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-elevated transition-all duration-200 text-left cursor-pointer group"
            >
              <Icon size={20} className="text-primary group-hover:scale-110 transition-transform" weight="duotone" />
              <span className="text-2xl font-black text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </button>
          ))}
        </motion.div>
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
