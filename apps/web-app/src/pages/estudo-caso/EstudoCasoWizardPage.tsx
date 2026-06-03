import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ESTUDO_CASO_WIZARD_STEPS,
  type EstudoCasoWizardStep,
  useEstudoCasoWizardStore,
  canNavigateEstudoCasoTo,
  estudoCasoStepIndex,
} from '@/stores/estudoCasoWizardStore'
import { buscarEixosEstudoCasoCatalogo } from '@/services/estudoCasoService'
import { StepProgressBar } from '@/components/common/StepProgressBar'
import { PageHeader } from '@/components/common/PageHeader'
import { EstudoCasoStep1Aluno } from './steps/EstudoCasoStep1Aluno'
import { EstudoCasoStep2Contexto } from './steps/EstudoCasoStep2Contexto'
import { EstudoCasoStep3Eixos } from './steps/EstudoCasoStep3Eixos'
import { EstudoCasoStep4Resultado } from './steps/EstudoCasoStep4Resultado'

const STEP_LABELS = [
  { label: 'Aluno', description: 'Quem é o foco' },
  { label: 'Contexto', description: 'Situação observada' },
  { label: 'Eixos', description: 'Observações pedagógicas' },
]

const STEP_COMPONENTS: Record<EstudoCasoWizardStep, React.ComponentType> = {
  aluno: EstudoCasoStep1Aluno,
  contexto: EstudoCasoStep2Contexto,
  eixos: EstudoCasoStep3Eixos,
  resultado: EstudoCasoStep4Resultado,
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

function redirectStepForGuard(state: ReturnType<typeof useEstudoCasoWizardStore.getState>): EstudoCasoWizardStep {
  if (!canNavigateEstudoCasoTo('contexto', state)) return 'aluno'
  if (!canNavigateEstudoCasoTo('eixos', state)) return 'contexto'
  if (!canNavigateEstudoCasoTo('resultado', state)) return 'eixos'
  return 'resultado'
}

export default function EstudoCasoWizardPage() {
  const { step: stepParam } = useParams<{ step?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentStep = useEstudoCasoWizardStore((s) => s.currentStep)
  const setStep = useEstudoCasoWizardStore((s) => s.setStep)
  const selecionarAluno = useEstudoCasoWizardStore((s) => s.selecionarAluno)
  const reset = useEstudoCasoWizardStore((s) => s.reset)
  const setCatalogoEixoIds = useEstudoCasoWizardStore((s) => s.setCatalogoEixoIds)

  const { data: eixosCatalogoLista = [] } = useQuery({
    queryKey: ['estudo-caso-eixos-catalogo'],
    queryFn: buscarEixosEstudoCasoCatalogo,
  })

  useEffect(() => {
    if (eixosCatalogoLista.length > 0)
      setCatalogoEixoIds(eixosCatalogoLista.map((e) => e.id))
  }, [eixosCatalogoLista, setCatalogoEixoIds])

  useEffect(() => () => {
    reset()
  }, [reset])

  useEffect(() => {
    const raw = searchParams.get('alunoId')
    if (!raw) return
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) selecionarAluno(n)
  }, [searchParams, selecionarAluno])

  useEffect(() => {
    const urlStep = (stepParam as EstudoCasoWizardStep) || 'aluno'
    const qs = searchParams.toString()
    const suffix = qs ? `?${qs}` : ''

    if (!ESTUDO_CASO_WIZARD_STEPS.includes(urlStep)) {
      navigate(`/estudo-caso/nova/aluno${suffix}`, { replace: true })
      return
    }

    const state = useEstudoCasoWizardStore.getState()
    if (!canNavigateEstudoCasoTo(urlStep, state)) {
      const fix = redirectStepForGuard(state)
      navigate(`/estudo-caso/nova/${fix}${suffix}`, { replace: true })
      setStep(fix)
      return
    }

    setStep(urlStep)
  }, [stepParam, navigate, setStep, searchParams])

  const stepIndex =
    currentStep === 'resultado' ? STEP_LABELS.length : estudoCasoStepIndex(currentStep)
  const direction = stepIndex
  const StepComponent = STEP_COMPONENTS[currentStep]

  return (
    <div className="space-y-6">
      <PageHeader title="Novo estudo de caso" backTo="/estudo-caso" />

      <StepProgressBar steps={STEP_LABELS} currentStep={stepIndex} className="mb-2" />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
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
