import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  RELATORIO_WIZARD_STEPS,
  type RelatorioWizardStep,
  useRelatorioWizardStore,
  canNavigateRelatorioTo,
  relatorioStepIndex,
} from '@/stores/relatorioWizardStore'
import { StepProgressBar } from '@/components/common/StepProgressBar'
import { PageHeader } from '@/components/common/PageHeader'
import { RelatorioStep1Aluno } from './steps/RelatorioStep1Aluno'
import { RelatorioStep2Periodo } from './steps/RelatorioStep2Periodo'
import { RelatorioStep3Levantamento } from './steps/RelatorioStep3Levantamento'
import { RelatorioStep4Geracao } from './steps/RelatorioStep4Geracao'

const STEP_LABELS = [
  { label: 'Aluno', description: 'Quem é o foco' },
  { label: 'Período', description: 'Intervalo avaliado' },
  { label: 'Levantamento', description: 'Dados encontrados' },
  { label: 'Geração', description: 'Relatório pela IA' },
]

const STEP_COMPONENTS: Record<RelatorioWizardStep, React.ComponentType> = {
  aluno: RelatorioStep1Aluno,
  periodo: RelatorioStep2Periodo,
  levantamento: RelatorioStep3Levantamento,
  geracao: RelatorioStep4Geracao,
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
}

function redirectStepForGuard(state: ReturnType<typeof useRelatorioWizardStore.getState>): RelatorioWizardStep {
  if (!canNavigateRelatorioTo('periodo', state)) return 'aluno'
  if (!canNavigateRelatorioTo('levantamento', state)) return 'periodo'
  if (!canNavigateRelatorioTo('geracao', state)) return 'levantamento'
  return 'geracao'
}

export default function RelatorioWizardPage() {
  const { step: stepParam } = useParams<{ step?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentStep = useRelatorioWizardStore((s) => s.currentStep)
  const setStep = useRelatorioWizardStore((s) => s.setStep)
  const selecionarAluno = useRelatorioWizardStore((s) => s.selecionarAluno)
  const reset = useRelatorioWizardStore((s) => s.reset)

  useEffect(
    () => () => {
      reset()
    },
    [reset]
  )

  useEffect(() => {
    const raw = searchParams.get('alunoId')
    if (!raw) return
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) selecionarAluno(n)
  }, [searchParams, selecionarAluno])

  useEffect(() => {
    const urlStep = (stepParam as RelatorioWizardStep) || 'aluno'
    const qs = searchParams.toString()
    const suffix = qs ? `?${qs}` : ''

    if (!RELATORIO_WIZARD_STEPS.includes(urlStep)) {
      navigate(`/relatorios/novo/aluno${suffix}`, { replace: true })
      return
    }

    const state = useRelatorioWizardStore.getState()
    if (!canNavigateRelatorioTo(urlStep, state)) {
      const fix = redirectStepForGuard(state)
      navigate(`/relatorios/novo/${fix}${suffix}`, { replace: true })
      setStep(fix)
      return
    }

    setStep(urlStep)
  }, [stepParam, navigate, setStep, searchParams])

  const stepIndex = relatorioStepIndex(currentStep)
  const StepComponent = STEP_COMPONENTS[currentStep]

  return (
    <div className="space-y-6">
      <PageHeader title="Novo Relatório Pedagógico" backTo="/relatorios" />

      <StepProgressBar steps={STEP_LABELS} currentStep={stepIndex} className="mb-2" />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={stepIndex}>
          <motion.div
            key={currentStep}
            custom={stepIndex}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
