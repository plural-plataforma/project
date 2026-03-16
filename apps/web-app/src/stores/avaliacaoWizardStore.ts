import { create } from 'zustand'
import type { AvaliacaoDiagnosticaDetalhada, CreateAvaliacaoDiagnosticaRequest } from '@/types/avaliacao-diagnostica'

export type WizardStep = 'identificacao' | 'alunos' | 'areas' | 'preview'

export const WIZARD_STEPS: WizardStep[] = ['identificacao', 'alunos', 'areas', 'preview']

interface AvaliacaoWizardState {
  currentStep: WizardStep
  data: Partial<CreateAvaliacaoDiagnosticaRequest>
  completedSteps: Set<WizardStep>
  avaliacaoId: number | null
  isEditing: boolean

  setStep: (step: WizardStep) => void
  updateData: (partial: Partial<CreateAvaliacaoDiagnosticaRequest>) => void
  markStepComplete: (step: WizardStep) => void
  setEditing: (avaliacaoId: number | null) => void
  hydrateFromAvaliacao: (avaliacaoId: number, detalhe: AvaliacaoDiagnosticaDetalhada) => void
  canNavigateTo: (step: WizardStep) => boolean
  reset: () => void
}

const initialState = {
  currentStep: 'identificacao' as WizardStep,
  data: {},
  completedSteps: new Set<WizardStep>(),
  avaliacaoId: null,
  isEditing: false,
}

export const useAvaliacaoWizardStore = create<AvaliacaoWizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  updateData: (partial) =>
    set((state) => ({ data: { ...state.data, ...partial } })),

  markStepComplete: (step) =>
    set((state) => ({
      completedSteps: new Set([...state.completedSteps, step]),
    })),

  setEditing: (avaliacaoId) =>
    set({
      avaliacaoId,
      isEditing: !!avaliacaoId,
    }),

  hydrateFromAvaliacao: (avaliacaoId, detalhe) =>
    set({
      avaliacaoId,
      isEditing: true,
      data: {
        id: avaliacaoId,
        titulo: detalhe.titulo,
        objetivo: detalhe.objetivo,
        dataAplicacao: detalhe.dataAplicacao,
        escolaId: detalhe.escola?.id ?? detalhe.escolaId ?? null,
        alunoIds:
          detalhe.alunoIds ??
          (detalhe.alunosParticipantes?.map((a) => a.alunoId) ??
            detalhe.alunos?.map((a) => a.id) ??
            []),
        blocos:
          detalhe.blocosComAtividades?.map((bloco) => ({
            blocoId: bloco.id,
            atividadeIds: bloco.atividades.map((atividade) => atividade.id),
          })) ?? [],
      },
      completedSteps: new Set(['identificacao', 'alunos', 'areas']),
    }),

  canNavigateTo: (step) => {
    const { completedSteps } = get()
    const stepIndex = WIZARD_STEPS.indexOf(step)
    if (stepIndex === 0) return true
    const prevStep = WIZARD_STEPS[stepIndex - 1]
    return completedSteps.has(prevStep)
  },

  reset: () =>
    set({
      currentStep: 'identificacao',
      data: {},
      completedSteps: new Set(),
      avaliacaoId: null,
      isEditing: false,
    }),
}))
