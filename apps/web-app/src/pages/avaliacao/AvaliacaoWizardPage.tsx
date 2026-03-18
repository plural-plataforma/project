import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useAvaliacaoWizardStore, WIZARD_STEPS, type WizardStep } from '@/stores/avaliacaoWizardStore'
import { StepProgressBar } from '@/components/common/StepProgressBar'
import { PageHeader } from '@/components/common/PageHeader'
import { buscarAvaliacaoPorId } from '@/services/avaliacaoDiagnosticaService'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { WizardStep1Identificacao } from './steps/WizardStep1Identificacao'
import { WizardStep2Alunos } from './steps/WizardStep2Alunos'
import { WizardStep3Areas } from './steps/WizardStep3Areas'
import { WizardStep4Preview } from './steps/WizardStep4Preview'

const STEP_LABELS = [
  { label: 'Identificação', description: 'Nome e data' },
  { label: 'Alunos', description: 'Selecionar alunos' },
  { label: 'Áreas', description: 'Selecionar blocos' },
  { label: 'Revisão', description: 'Confirmar e criar' },
]

const STEP_COMPONENTS: Record<WizardStep, React.ComponentType> = {
  identificacao: WizardStep1Identificacao,
  alunos: WizardStep2Alunos,
  areas: WizardStep3Areas,
  preview: WizardStep4Preview,
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

export default function AvaliacaoWizardPage() {
  const { step: stepParam, avaliacaoId: avaliacaoIdParam } = useParams<{ step?: string; avaliacaoId?: string }>()
  const navigate = useNavigate()
  const {
    currentStep,
    setStep,
    canNavigateTo,
    reset,
    hydrateFromAvaliacao,
    setEditing,
  } = useAvaliacaoWizardStore()
  const avaliacaoId = Number(avaliacaoIdParam)
  const isEditingRoute = Number.isFinite(avaliacaoId) && avaliacaoId > 0

  const { data: avaliacaoDetalhe, isLoading: loadingAvaliacao } = useQuery({
    queryKey: ['avaliacao-edicao', avaliacaoId],
    queryFn: () => buscarAvaliacaoPorId(avaliacaoId),
    enabled: isEditingRoute,
    staleTime: 0,
    refetchOnMount: true,
  })

  useEffect(() => {
    if (isEditingRoute && avaliacaoDetalhe) {
      hydrateFromAvaliacao(avaliacaoId, avaliacaoDetalhe)
    }
  }, [avaliacaoDetalhe, avaliacaoId, hydrateFromAvaliacao, isEditingRoute])

  // Sync URL ↔ store
  useEffect(() => {
    const urlStep = (stepParam as WizardStep) || 'identificacao'
    if (!WIZARD_STEPS.includes(urlStep)) return

    if (isEditingRoute) {
      setStep(urlStep)
      return
    }

    if (canNavigateTo(urlStep)) {
      setStep(urlStep)
    } else {
      // Guard: redirect to first incomplete step
      navigate('/avaliacoes/nova/identificacao', { replace: true })
    }
  }, [stepParam, canNavigateTo, isEditingRoute, navigate, setStep])

  useEffect(() => {
    if (isEditingRoute) {
      setEditing(avaliacaoId)
    } else {
      setEditing(null)
    }
  }, [avaliacaoId, isEditingRoute, setEditing])

  // Clean up on unmount
  useEffect(() => () => { reset() }, [])

  const stepIndex = WIZARD_STEPS.indexOf(currentStep)
  const direction = stepIndex

  const StepComponent = STEP_COMPONENTS[currentStep]

  return (
    <div className="space-y-6">
      <LoadingScreen
        visible={loadingAvaliacao}
        message="Carregando avaliação para edição..."
      />
      <PageHeader
        title={isEditingRoute ? 'Editar Avaliação Diagnóstica' : 'Nova Avaliação Diagnóstica'}
        backTo="/avaliacoes"
      />

      <StepProgressBar
        steps={STEP_LABELS}
        currentStep={stepIndex}
        className="mb-2"
      />

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
