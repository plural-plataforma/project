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
  /** Preenchido ao escolher aluno na lista (opcional se só vier ?alunoId= na URL). */
  alunoNome: string | null
  titulo: string
  contextoSituacao: string
  potencialidades: string
  /** ids dos eixos selecionados */
  eixosSelecionadosIds: number[]
  /** anotações opcionais por id de eixo */
  anotacoesPorEixo: Record<number, string>
  casoIdSalvo: number | null
  textoSimulado: string | null
  /** Texto gerado por IA (beta) — paralelo ao textoSimulado, disponível quando o provedor de IA responde com sucesso. */
  textoGeradoIA: string | null
  /** Ids do catálogo carregados na etapa Eixos (para validar “todos obrigatórios”). */
  catalogoEixoIds: number[]
  setStep: (s: EstudoCasoWizardStep) => void
  /** Define aluno; se `nomeCompleto` for omitido, limpa o nome armazenado (ex.: deep link só com id). */
  selecionarAluno: (id: number | null, nomeCompleto?: string | null) => void
  setTitulo: (t: string) => void
  setContexto: (c: string) => void
  setPotencialidades: (p: string) => void
  toggleEixo: (eixoId: number) => void
  setAnotacaoEixo: (eixoId: number, texto: string) => void
  setCasoSalvo: (id: number, texto: string | null) => void
  setTextoGeradoIA: (texto: string | null) => void
  setCatalogoEixoIds: (ids: number[]) => void
  reset: () => void
}

const initial = {
  currentStep: 'aluno' as EstudoCasoWizardStep,
  alunoId: null as number | null,
  alunoNome: null as string | null,
  titulo: '',
  contextoSituacao: '',
  potencialidades: '',
  eixosSelecionadosIds: [] as number[],
  anotacoesPorEixo: {} as Record<number, string>,
  casoIdSalvo: null as number | null,
  textoSimulado: null as string | null,
  textoGeradoIA: null as string | null,
  catalogoEixoIds: [] as number[],
}

export const useEstudoCasoWizardStore = create<EstudoCasoWizardState>((set, get) => ({
  ...initial,
  setStep: (s) => set({ currentStep: s }),
  selecionarAluno: (id, nomeCompleto) =>
    set({
      alunoId: id,
      alunoNome:
        id == null ? null : nomeCompleto !== undefined ? (nomeCompleto?.trim() || null) : null,
    }),
  setTitulo: (t) => set({ titulo: t }),
  setContexto: (c) => set({ contextoSituacao: c }),
  setPotencialidades: (p) => set({ potencialidades: p }),
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
  setTextoGeradoIA: (texto) => set({ textoGeradoIA: texto }),
  setCatalogoEixoIds: (ids) =>
    set({ catalogoEixoIds: [...ids], eixosSelecionadosIds: [...ids] }),
  reset: () => set({ ...initial }),
}))

/** Todos os eixos do catálogo devem estar marcados (Fase 3 — aceite pedagógico). */
export function estudoCasoCatalogoEixosCompleto(catalogoIds: number[], selecionadosIds: number[]): boolean {
  if (catalogoIds.length === 0) return false
  if (selecionadosIds.length !== catalogoIds.length) return false
  const set = new Set(selecionadosIds)
  return catalogoIds.every((id) => set.has(id))
}

export function estudoCasoStepIndex(step: EstudoCasoWizardStep): number {
  return ESTUDO_CASO_WIZARD_STEPS.indexOf(step)
}

export function canNavigateEstudoCasoTo(step: EstudoCasoWizardStep, state: EstudoCasoWizardState): boolean {
  const idx = estudoCasoStepIndex(step)
  if (idx < 0) return false
  if (step === 'aluno') return true
  if (step === 'contexto')
    return state.alunoId != null && state.alunoId > 0
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
      estudoCasoCatalogoEixosCompleto(state.catalogoEixoIds, state.eixosSelecionadosIds)
    )
  }
  return false
}
