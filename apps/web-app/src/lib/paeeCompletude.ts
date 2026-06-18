import type { Planejamento } from '@/types/planejamento'

export interface PaeeChecklistItem {
  id: string
  label: string
  ok: boolean
  opcional?: boolean
}

export interface PaeeCompletudeResult {
  itens: PaeeChecklistItem[]
  completo: boolean
  percentual: number
}

function textoPreenchido(t?: string | null): boolean {
  return (t ?? '').trim().length > 0
}

/** Heurística de completude do PAEE para revisão e badges na lista. */
export function avaliarCompletudePaee(
  plan: Pick<
    Planejamento,
    | 'alunos'
    | 'habilidades'
    | 'estrategias'
    | 'avaliacao'
    | 'objetivoCurtoPrazo'
    | 'objetivoMedioPrazo'
    | 'objetivoLongoPrazo'
    | 'encontros'
    | 'documentoDeclaradoAssinado'
    | 'assinaturaNomeResponsavel'
  >,
): PaeeCompletudeResult {
  const itens: PaeeChecklistItem[] = [
    {
      id: 'alunos',
      label: 'Pelo menos um aluno vinculado',
      ok: (plan.alunos?.length ?? 0) > 0,
    },
    {
      id: 'habilidades',
      label: 'Habilidades selecionadas',
      ok: (plan.habilidades?.length ?? 0) > 0,
    },
    {
      id: 'estrategias',
      label: 'Estratégias pedagógicas',
      ok: (plan.estrategias?.length ?? 0) > 0,
    },
    {
      id: 'criterios',
      label: 'Critérios avaliativos',
      ok: (plan.avaliacao?.length ?? 0) > 0,
    },
    {
      id: 'obj-curto',
      label: 'Objetivo de curto prazo',
      ok: textoPreenchido(plan.objetivoCurtoPrazo),
    },
    {
      id: 'obj-medio',
      label: 'Objetivo de médio prazo',
      ok: textoPreenchido(plan.objetivoMedioPrazo),
    },
    {
      id: 'obj-longo',
      label: 'Objetivo de longo prazo',
      ok: textoPreenchido(plan.objetivoLongoPrazo),
    },
    {
      id: 'encontros',
      label: 'Grade com pelo menos um encontro',
      ok: (plan.encontros?.length ?? 0) > 0,
    },
    {
      id: 'assinatura',
      label: 'Assinatura (nome do responsável)',
      ok: textoPreenchido(plan.assinaturaNomeResponsavel),
      opcional: true,
    },
  ]

  const obrigatorios = itens.filter((i) => !i.opcional)
  const okCount = obrigatorios.filter((i) => i.ok).length
  const completo = obrigatorios.every((i) => i.ok)

  return {
    itens,
    completo,
    percentual: obrigatorios.length > 0 ? Math.round((okCount / obrigatorios.length) * 100) : 0,
  }
}
