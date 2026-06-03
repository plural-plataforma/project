/** Ordem pedagógica acordada: Escola → Aluno → Estudo de caso → Avaliação → PAEE → Registro de atendimento. */
export type PedagogicalFlowStepId =
  | 'escola'
  | 'aluno'
  | 'estudo-caso'
  | 'avaliacao'
  | 'paee'
  | 'relatos'

export interface PedagogicalFlowStep {
  id: PedagogicalFlowStepId
  /** Rótulo no menu lateral */
  label: string
  route: string
  /** Marca item ativo em rotas filhas (wizards, detalhe) */
  activePathPrefix?: string
  journeyTitle: string
  journeyDescription: string
  ctaLabel: string
  ctaDoneLabel: string
  /** Mensagem quando a etapa anterior ainda não foi concluída */
  pendingReason: string
}

export const PEDAGOGICAL_FLOW_STEPS: PedagogicalFlowStep[] = [
  {
    id: 'escola',
    label: 'Escolas',
    route: '/escolas',
    activePathPrefix: '/escolas',
    journeyTitle: 'Cadastrar escola',
    journeyDescription: 'Vincule a escola onde você atua. Esse é o primeiro passo da jornada pedagógica.',
    ctaLabel: 'Cadastrar escola',
    ctaDoneLabel: 'Ver escolas',
    pendingReason: '',
  },
  {
    id: 'aluno',
    label: 'Alunos',
    route: '/alunos',
    activePathPrefix: '/alunos',
    journeyTitle: 'Cadastrar alunos',
    journeyDescription: 'Registre os estudantes atendidos para seguir com estudo de caso e demais documentos.',
    ctaLabel: 'Cadastrar alunos',
    ctaDoneLabel: 'Ver alunos',
    pendingReason: 'Disponível após cadastrar ao menos uma escola.',
  },
  {
    id: 'estudo-caso',
    label: 'Estudo de caso',
    route: '/estudo-caso',
    activePathPrefix: '/estudo-caso',
    journeyTitle: 'Elaborar estudo de caso',
    journeyDescription: 'Preencha os eixos do estudo de caso antes da avaliação diagnóstica e do PAEE.',
    ctaLabel: 'Novo estudo de caso',
    ctaDoneLabel: 'Ver estudos de caso',
    pendingReason: 'Disponível após cadastrar ao menos um aluno.',
  },
  {
    id: 'avaliacao',
    label: 'Avaliação diagnóstica',
    route: '/avaliacoes',
    activePathPrefix: '/avaliacoes',
    journeyTitle: 'Realizar avaliação diagnóstica',
    journeyDescription: 'Avalie o desempenho por áreas e gere o diagnóstico que alimenta o planejamento.',
    ctaLabel: 'Nova avaliação',
    ctaDoneLabel: 'Ver avaliações',
    pendingReason: 'Disponível após registrar ao menos um estudo de caso.',
  },
  {
    id: 'paee',
    label: 'PAEE',
    route: '/planejamentos',
    activePathPrefix: '/planejamentos',
    journeyTitle: 'Montar PAEE',
    journeyDescription: 'Organize objetivos, encontros e estratégias do Plano de Atendimento Educacional Especializado.',
    ctaLabel: 'Criar PAEE',
    ctaDoneLabel: 'Ver PAEE',
    pendingReason: 'Disponível após criar ao menos uma avaliação diagnóstica.',
  },
  {
    id: 'relatos',
    label: 'Registro de atendimento',
    route: '/relatos',
    activePathPrefix: '/relatos',
    journeyTitle: 'Registrar atendimentos',
    journeyDescription: 'Documente sessões, presença e observações pedagógicas ao longo do período.',
    ctaLabel: 'Novo registro',
    ctaDoneLabel: 'Ver registros',
    pendingReason: 'Disponível após criar ao menos um PAEE.',
  },
]

export const PEDAGOGICAL_FLOW_STEP_COUNT = PEDAGOGICAL_FLOW_STEPS.length

/** Menu extra (após o fluxo principal): download combinado quando estudo + PAEE existem. */
export const DOCUMENTACAO_PEDAGOGICA_NAV = {
  label: 'Estudo de caso + PAEE',
  route: '/documentacao-pedagogica',
  activePathPrefix: '/documentacao-pedagogica',
} as const
