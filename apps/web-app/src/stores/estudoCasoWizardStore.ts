import { create } from 'zustand'

export type EstudoCasoWizardStep = 'aluno' | 'contexto' | 'eixos' | 'resultado'

export const ESTUDO_CASO_WIZARD_STEPS: EstudoCasoWizardStep[] = [
  'aluno',
  'contexto',
  'eixos',
  'resultado',
]

interface EstudoCasoWizardState {
  currentStep: EstudoCasoWizardStep
  alunoId: number | null
  titulo: string
  contextoSituacao: string
  /** ids dos eixos selecionados */
  eixosSelecionadosIds: number[]
  /** anotações opcionais por id de eixo */
  anotacoesPorEixo: Record<number, string>
  casoIdSalvo: number | null
  textoSimulado: string | null
  setStep: (s: EstudoCasoWizardStep) => void
  setAlunoId: (id: number | null) => void
  setTitulo: (t: string) => void
  setContexto: (c: string) => void
  toggleEixo: (eixoId: number) => void
  setAnotacaoEixo: (eixoId: number, texto: string) => void
  setCasoSalvo: (id: number, texto: string | null) => void
  reset: () => void
}

const initial = {
  currentStep: 'aluno' as EstudoCasoWizardStep,
  alunoId: null as number | null,
  titulo: '',
  contextoSituacao: '',
  eixosSelecionadosIds: [] as number[],
  anotacoesPorEixo: {} as Record<number, string>,
  casoIdSalvo: null as number | null,
  textoSimulado: null as string | null,
}

export const useEstudoCasoWizardStore = create<EstudoCasoWizardState>((set, get) => ({
  ...initial,
  setStep: (s) => set({ currentStep: s }),
  setAlunoId: (id) => set({ alunoId: id }),
  setTitulo: (t) => set({ titulo: t }),
  setContexto: (c) => set({ contextoSituacao: c }),
  toggleEixo: (eixoId) => {
    const cur = get().eixosSelecionadosIds
    if (cur.includes(eixoId)) {
      set({
        eixosSelecionadosIds: cur.filter((x) => x !== eixoId),
      })
    } else {
      set({ eixosSelecionadosIds: [...cur, eixoId] })
    }
  },
  setAnotacaoEixo: (eixoId, texto) =>
    set((state) => ({
      anotacoesPorEixo: { ...state.anotacoesPorEixo, [eixoId]: texto },
    })),
  setCasoSalvo: (id, texto) => set({ casoIdSalvo: id, textoSimulado: texto }),
  reset: () => set({ ...initial }),
}))

export function estudoCasoStepIndex(step: EstudoCasoWizardStep): number {
  return ESTUDO_CASO_WIZARD_STEPS.indexOf(step)
}

export function canNavigateEstudoCasoTo(step: EstudoCasoWizardStep, state: EstudoCasoWizardState): boolean {
  const idx = estudoCasoStepIndex(step)
  if (idx < 0) return false
  if (step === 'aluno') return true
  if (step === 'contexto') return state.alunoId != null && state.alunoId > 0
  if (step === 'eixos') {
    return (
      state.alunoId != null &&
      state.titulo.trim().length > 0 &&
      state.contextoSituacao.trim().length > 0
    )
  }
  if (step === 'resultado') {
    return (
      canNavigateEstudoCasoTo('eixos', state) &&
      state.eixosSelecionadosIds.length > 0
    )
  }
  return false
}
