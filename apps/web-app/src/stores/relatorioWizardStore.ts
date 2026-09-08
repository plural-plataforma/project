import dayjs from 'dayjs'
import { create } from 'zustand'
import type { RelatorioTipoPeriodoCodigo } from '@/types/relatorio'

export type RelatorioWizardStep = 'aluno' | 'periodo' | 'levantamento' | 'geracao'

export const RELATORIO_WIZARD_STEPS: RelatorioWizardStep[] = [
  'aluno',
  'periodo',
  'levantamento',
  'geracao',
]

interface RelatorioWizardState {
  currentStep: RelatorioWizardStep
  alunoId: number | null
  /** Preenchido ao escolher aluno na lista (opcional se só vier ?alunoId= na URL). */
  alunoNome: string | null
  tipoPeriodo: RelatorioTipoPeriodoCodigo
  dataInicio: string
  dataFim: string
  /** Preenchido ao concluir a etapa de geração — usado pra navegar pro relatório recém-criado. */
  relatorioIdCriado: number | null
  setStep: (s: RelatorioWizardStep) => void
  selecionarAluno: (id: number | null, nomeCompleto?: string | null) => void
  setTipoPeriodo: (t: RelatorioTipoPeriodoCodigo) => void
  setDataInicio: (d: string) => void
  setDataFim: (d: string) => void
  setRelatorioCriado: (id: number) => void
  reset: () => void
}

const hoje = dayjs()

const initial = {
  currentStep: 'aluno' as RelatorioWizardStep,
  alunoId: null as number | null,
  alunoNome: null as string | null,
  tipoPeriodo: 1 as RelatorioTipoPeriodoCodigo,
  dataInicio: hoje.startOf('year').format('YYYY-MM-DD'),
  dataFim: hoje.format('YYYY-MM-DD'),
  relatorioIdCriado: null as number | null,
}

export const useRelatorioWizardStore = create<RelatorioWizardState>((set) => ({
  ...initial,
  setStep: (s) => set({ currentStep: s }),
  selecionarAluno: (id, nomeCompleto) =>
    set({
      alunoId: id,
      alunoNome:
        id == null ? null : nomeCompleto !== undefined ? (nomeCompleto?.trim() || null) : null,
    }),
  setTipoPeriodo: (t) => set({ tipoPeriodo: t }),
  setDataInicio: (d) => set({ dataInicio: d }),
  setDataFim: (d) => set({ dataFim: d }),
  setRelatorioCriado: (id) => set({ relatorioIdCriado: id }),
  reset: () => set({ ...initial }),
}))

export function relatorioStepIndex(step: RelatorioWizardStep): number {
  return RELATORIO_WIZARD_STEPS.indexOf(step)
}

export function canNavigateRelatorioTo(step: RelatorioWizardStep, state: RelatorioWizardState): boolean {
  const idx = relatorioStepIndex(step)
  if (idx < 0) return false
  if (step === 'aluno') return true
  if (step === 'periodo') return state.alunoId != null && state.alunoId > 0
  if (step === 'levantamento') {
    return (
      canNavigateRelatorioTo('periodo', state) &&
      !!state.dataInicio &&
      !!state.dataFim &&
      state.dataInicio <= state.dataFim
    )
  }
  if (step === 'geracao') return canNavigateRelatorioTo('levantamento', state)
  return false
}
