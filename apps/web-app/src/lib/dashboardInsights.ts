import dayjs from 'dayjs'
import type { Aluno } from '@/types/aluno'
import type { AvaliacaoDiagnosticaResumo } from '@/types/avaliacao-diagnostica'
import type { EstudoCasoListaItem } from '@/types/estudoCaso'
import type { Escola } from '@/types/escolas'
import type { Planejamento } from '@/types/planejamento'
import type { RelatoAtendimento } from '@/types/relatoAtendimento'

/** Ordenação segura quando a API omite datas ou usa camelCase/PascalCase inconsistente. */
function primeiraDataIso(...candidatos: (string | undefined | null)[]): string {
  for (const c of candidatos) {
    const t = c?.trim()
    if (t) return t
  }
  return ''
}

function compararDataDesc(a: string, b: string): number {
  return b.localeCompare(a)
}

function dataAvaliacaoOrdenacao(a: AvaliacaoDiagnosticaResumo): string {
  const raw = a as AvaliacaoDiagnosticaResumo & { UpdatedAt?: string; CreatedAt?: string; DataAplicacao?: string }
  return primeiraDataIso(raw.updatedAt, raw.UpdatedAt, raw.dataAplicacao, raw.DataAplicacao, raw.createdAt, raw.CreatedAt)
}

function dataEstudoOrdenacao(e: EstudoCasoListaItem): string {
  const raw = e as EstudoCasoListaItem & { UpdatedAt?: string }
  return primeiraDataIso(raw.updatedAt, raw.UpdatedAt)
}

function dataRelatoOrdenacao(r: RelatoAtendimento): string {
  const raw = r as RelatoAtendimento & { DataSessao?: string }
  return primeiraDataIso(raw.dataSessao, raw.DataSessao)
}

export type DashboardAlertTone = 'info' | 'warning' | 'success' | 'primary'

export interface DashboardAlert {
  id: string
  tone: DashboardAlertTone
  title: string
  description: string
  route?: string
  ctaLabel?: string
}

export interface DashboardMetric {
  id: string
  label: string
  value: string
  hint: string
  route: string
  accent: 'primary' | 'success' | 'amber' | 'violet'
}

export interface RecentActivityItem {
  id: string
  kind: 'relato' | 'estudo' | 'avaliacao' | 'paee'
  title: string
  subtitle: string
  dateLabel: string
  route: string
}

export interface DashboardInsights {
  metrics: DashboardMetric[]
  alerts: DashboardAlert[]
  recent: RecentActivityItem[]
  coberturaPercent: number
  alunosSemEstudo: Aluno[]
  alunosSemPaee: Aluno[]
  relatosMes: number
  presencaMesPercent: number | null
  paeeAtivos: number
  totalEstudosCaso: number
  totalFusoes: number
  charts: DashboardCharts
}

export interface DashboardChartSlice {
  id: string
  label: string
  value: number
  color: string
}

export interface DashboardBarPoint {
  label: string
  value: number
}

export interface DashboardCharts {
  /** Cobertura documental por aluno */
  coberturaAlunos: DashboardChartSlice[]
  /** Presença nos atendimentos do mês */
  presencaMes: DashboardChartSlice[]
  /** Registros de atendimento — últimas 6 semanas */
  relatosPorSemana: DashboardBarPoint[]
  /** Volume total por tipo de recurso */
  volumeRecursos: DashboardBarPoint[]
  /** Etapas da jornada (0–100 por etapa concluída) */
  jornadaProgresso: { id: string; label: string; percent: number }[]
}

export function formatMesReferencia(ref = dayjs()): string {
  return ref.toDate().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function formatMesCurto(ref = dayjs()): string {
  return ref.toDate().toLocaleDateString('pt-BR', { month: 'long' })
}

export function saudacaoPorHorario(date = new Date()): string {
  const h = date.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function contextoEscolas(escolas: Escola[]): string {
  if (escolas.length === 0) return 'Nenhuma escola vinculada ainda'
  if (escolas.length === 1) return escolas[0].nomeInstituicao
  return `${escolas.length} escolas vinculadas`
}

function isPaeeAtivo(p: Planejamento, ref = dayjs()): boolean {
  const ini = dayjs(p.dataInicio)
  const fim = dayjs(p.dataFim)
  return !ref.isBefore(ini, 'day') && !ref.isAfter(fim, 'day')
}

function alunoIdsComPaee(planejamentos: Planejamento[]): Set<number> {
  const ids = new Set<number>()
  for (const p of planejamentos) {
    for (const a of p.alunos ?? []) {
      if (a.id != null) ids.add(a.id)
    }
  }
  return ids
}

export function contarFusoesEstudoPaee(
  alunos: Aluno[],
  planejamentos: Planejamento[],
  estudosCaso: EstudoCasoListaItem[]
): number {
  const alunosComEstudo = new Set(estudosCaso.map((e) => e.alunoId))
  const comPaee = alunoIdsComPaee(planejamentos)
  let n = 0
  for (const a of alunos) {
    if (a.id == null) continue
    if (alunosComEstudo.has(a.id) && comPaee.has(a.id)) n++
  }
  return n
}

const CHART_COLORS = {
  primary: '#276678',
  success: '#28a745',
  amber: '#FFBE33',
  purple: '#8B7BAB',
  muted: '#cbd5e1',
  danger: '#ef4444',
} as const

function computeCoberturaSlices(
  alunos: Aluno[],
  estudosCaso: EstudoCasoListaItem[],
  planejamentos: Planejamento[]
): DashboardChartSlice[] {
  const comEstudo = new Set(estudosCaso.map((e) => e.alunoId))
  const comPaee = alunoIdsComPaee(planejamentos)
  let completo = 0
  let soEstudo = 0
  let soPaee = 0
  let nenhum = 0

  for (const a of alunos) {
    if (a.id == null) continue
    const e = comEstudo.has(a.id)
    const p = comPaee.has(a.id)
    if (e && p) completo++
    else if (e) soEstudo++
    else if (p) soPaee++
    else nenhum++
  }

  return [
    { id: 'completo', label: 'Estudo + PAEE', value: completo, color: CHART_COLORS.success },
    { id: 'estudo', label: 'Só estudo de caso', value: soEstudo, color: CHART_COLORS.primary },
    { id: 'paee', label: 'Só PAEE', value: soPaee, color: CHART_COLORS.purple },
    { id: 'nenhum', label: 'Sem documentação', value: nenhum, color: CHART_COLORS.muted },
  ]
}

function computeRelatosPorSemana(relatos: RelatoAtendimento[], ref: dayjs.Dayjs): DashboardBarPoint[] {
  const pontos: DashboardBarPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const inicio = ref.startOf('week').subtract(i, 'week')
    const fim = inicio.endOf('week')
    const count = relatos.filter((r) => {
      const d = dataRelatoOrdenacao(r)
      if (!d) return false
      const dia = dayjs(d)
      return !dia.isBefore(inicio, 'day') && !dia.isAfter(fim, 'day')
    }).length
    pontos.push({
      label: i === 0 ? 'Esta sem.' : inicio.format('DD/MM'),
      value: count,
    })
  }
  return pontos
}

function computeDashboardCharts(input: {
  alunos: Aluno[]
  planejamentos: Planejamento[]
  avaliacoes: AvaliacaoDiagnosticaResumo[]
  estudosCaso: EstudoCasoListaItem[]
  relatos: RelatoAtendimento[]
  relatosMesLista: RelatoAtendimento[]
  completionByStep: Record<string, boolean>
  ref: dayjs.Dayjs
}): DashboardCharts {
  const presentes = input.relatosMesLista.filter((r) => r.presencaPresente).length
  const ausentes = input.relatosMesLista.length - presentes

  const jornadaLabels: Record<string, string> = {
    escola: 'Escola',
    aluno: 'Alunos',
    'estudo-caso': 'Estudo de caso',
    avaliacao: 'Avaliação',
    paee: 'PAEE',
    relatos: 'Atendimentos',
  }

  return {
    coberturaAlunos: computeCoberturaSlices(input.alunos, input.estudosCaso, input.planejamentos),
    presencaMes: [
      { id: 'presente', label: 'Presentes', value: presentes, color: CHART_COLORS.success },
      { id: 'ausente', label: 'Ausentes', value: ausentes, color: CHART_COLORS.danger },
    ],
    relatosPorSemana: computeRelatosPorSemana(input.relatos, input.ref),
    volumeRecursos: [
      { label: 'Alunos', value: input.alunos.length },
      { label: 'Estudos', value: input.estudosCaso.length },
      { label: 'Avaliações', value: input.avaliacoes.length },
      { label: 'PAEE', value: input.planejamentos.length },
      { label: 'Atendimentos', value: input.relatos.length },
    ],
    jornadaProgresso: Object.entries(jornadaLabels).map(([id, label]) => ({
      id,
      label,
      percent: input.completionByStep[id] ? 100 : 0,
    })),
  }
}

export function computeDashboardInsights(input: {
  alunos: Aluno[]
  escolas: Escola[]
  planejamentos: Planejamento[]
  avaliacoes: AvaliacaoDiagnosticaResumo[]
  estudosCaso: EstudoCasoListaItem[]
  relatos: RelatoAtendimento[]
  ref?: dayjs.Dayjs
  completionByStep?: Record<string, boolean>
}): DashboardInsights {
  const ref = input.ref ?? dayjs()
  const mesIni = ref.startOf('month').format('YYYY-MM-DD')
  const mesFim = ref.endOf('month').format('YYYY-MM-DD')

  const relatosMesLista = input.relatos.filter((r) => {
    const d = dataRelatoOrdenacao(r)
    return d >= mesIni && d <= mesFim
  })
  const relatosMes = relatosMesLista.length
  const presentesMes = relatosMesLista.filter((r) => r.presencaPresente).length
  const presencaMesPercent =
    relatosMes > 0 ? Math.round((presentesMes / relatosMes) * 100) : null

  const paeeAtivos = input.planejamentos.filter((p) => isPaeeAtivo(p, ref)).length
  const avaliacoesSemDono = input.avaliacoes.filter((a) => a.professorId == null).length
  const avaliacoesEmAndamento = input.avaliacoes.filter(
    (a) => a.status === 'EmAndamento' || a.status === 'Pendente'
  ).length

  const alunosComEstudo = new Set(input.estudosCaso.map((e) => e.alunoId))
  const alunosComPaee = alunoIdsComPaee(input.planejamentos)
  const alunosSemEstudo = input.alunos.filter((a) => a.id != null && !alunosComEstudo.has(a.id))
  const alunosSemPaee = input.alunos.filter((a) => a.id != null && !alunosComPaee.has(a.id))

  const totalAlunos = input.alunos.length
  const totalFusoes = contarFusoesEstudoPaee(input.alunos, input.planejamentos, input.estudosCaso)
  const coberturaPercent =
    totalAlunos > 0 ? Math.round((totalFusoes / totalAlunos) * 100) : 0

  const metrics: DashboardMetric[] = [
    {
      id: 'alunos',
      label: 'Alunos ativos',
      value: String(totalAlunos),
      hint:
        totalAlunos === 0
          ? 'Cadastre seu primeiro aluno'
          : `${input.escolas.length} escola${input.escolas.length !== 1 ? 's' : ''} na sua conta`,
      route: '/alunos',
      accent: 'primary',
    },
    {
      id: 'paee-ativos',
      label: 'PAEE em vigor',
      value: String(paeeAtivos),
      hint:
        paeeAtivos === 0
          ? input.planejamentos.length > 0
            ? 'Nenhum PAEE no período atual'
            : 'Crie um plano de atendimento'
          : `${input.planejamentos.length} plano${input.planejamentos.length !== 1 ? 's' : ''} no total`,
      route: '/planejamentos',
      accent: 'violet',
    },
    {
      id: 'relatos-mes',
      label: 'Atendimentos no mês',
      value: String(relatosMes),
      hint:
        presencaMesPercent != null
          ? `${presencaMesPercent}% de presença em ${formatMesCurto(ref)}`
          : `Registre sessões em ${formatMesCurto(ref)}`,
      route: '/relatos',
      accent: 'success',
    },
    {
      id: 'cobertura',
      label: 'Documentação completa',
      value: totalAlunos > 0 ? `${coberturaPercent}%` : '—',
      hint:
        totalFusoes > 0
          ? `${totalFusoes} aluno${totalFusoes !== 1 ? 's' : ''} com estudo + PAEE`
          : 'Estudo de caso e PAEE por aluno',
      route: '/documentacao-pedagogica',
      accent: 'amber',
    },
  ]

  const alerts: DashboardAlert[] = []

  if (avaliacoesSemDono > 0) {
    alerts.push({
      id: 'av-sem-dono',
      tone: 'warning',
      title: `${avaliacoesSemDono} avaliação${avaliacoesSemDono !== 1 ? 'ões' : ''} sem responsável`,
      description: 'Assuma a avaliação para organizar seu fluxo diagnóstico.',
      route: '/avaliacoes',
      ctaLabel: 'Ver avaliações',
    })
  }

  if (alunosSemEstudo.length > 0 && totalAlunos > 0) {
    alerts.push({
      id: 'sem-estudo',
      tone: 'info',
      title: `${alunosSemEstudo.length} aluno${alunosSemEstudo.length !== 1 ? 's' : ''} sem estudo de caso`,
      description: 'Elaborar o estudo de caso estrutura o planejamento pedagógico.',
      route: '/estudo-caso/nova/aluno',
      ctaLabel: 'Novo estudo',
    })
  }

  if (alunosSemPaee.length > 0 && totalAlunos > 0 && input.estudosCaso.length > 0) {
    alerts.push({
      id: 'sem-paee',
      tone: 'primary',
      title: `${alunosSemPaee.length} aluno${alunosSemPaee.length !== 1 ? 's' : ''} sem PAEE`,
      description: 'Vincule um plano após a avaliação diagnóstica.',
      route: '/planejamentos',
      ctaLabel: 'Ver PAEE',
    })
  }

  if (relatosMes === 0 && totalAlunos > 0 && paeeAtivos > 0) {
    alerts.push({
      id: 'sem-relatos-mes',
      tone: 'info',
      title: 'Nenhum registro de atendimento neste mês',
      description: 'Documente as sessões realizadas para acompanhar a evolução.',
      route: '/relatos',
      ctaLabel: 'Registrar atendimento',
    })
  }

  if (totalFusoes > 0) {
    alerts.push({
      id: 'fusao-pronta',
      tone: 'success',
      title: 'Documentação pedagógica disponível',
      description: `${totalFusoes} pacote${totalFusoes !== 1 ? 's' : ''} prontos para download (estudo + PAEE).`,
      route: '/documentacao-pedagogica',
      ctaLabel: 'Baixar',
    })
  }

  if (avaliacoesEmAndamento > 0) {
    alerts.push({
      id: 'av-andamento',
      tone: 'primary',
      title: `${avaliacoesEmAndamento} avaliação${avaliacoesEmAndamento !== 1 ? 'ões' : ''} em andamento`,
      description: 'Continue o diagnóstico para alimentar o PAEE.',
      route: '/avaliacoes',
      ctaLabel: 'Continuar',
    })
  }

  const recent: RecentActivityItem[] = []

  for (const r of [...input.relatos]
    .sort((a, b) => compararDataDesc(dataRelatoOrdenacao(a), dataRelatoOrdenacao(b)))
    .slice(0, 4)) {
    recent.push({
      id: `relato-${r.id}`,
      kind: 'relato',
      title: r.alunoNome,
      subtitle: r.presencaPresente ? 'Presente' : 'Ausente',
      dateLabel: dayjs(dataRelatoOrdenacao(r) || undefined).isValid()
        ? dayjs(dataRelatoOrdenacao(r)).format('DD/MM/YYYY')
        : '—',
      route: '/relatos',
    })
  }

  for (const e of [...input.estudosCaso]
    .sort((a, b) => compararDataDesc(dataEstudoOrdenacao(a), dataEstudoOrdenacao(b)))
    .slice(0, 3)) {
    const dataEst = dataEstudoOrdenacao(e)
    recent.push({
      id: `estudo-${e.id}`,
      kind: 'estudo',
      title: e.titulo,
      subtitle: e.alunoNomeCompleto,
      dateLabel: dataEst && dayjs(dataEst).isValid() ? dayjs(dataEst).format('DD/MM/YYYY') : '—',
      route: '/estudo-caso',
    })
  }

  for (const a of [...input.avaliacoes]
    .sort((x, y) => compararDataDesc(dataAvaliacaoOrdenacao(x), dataAvaliacaoOrdenacao(y)))
    .slice(0, 2)) {
    const dataAv = dataAvaliacaoOrdenacao(a) || a.dataAplicacao
    recent.push({
      id: `av-${a.id}`,
      kind: 'avaliacao',
      title: a.titulo,
      subtitle: a.status === 'Concluida' ? 'Concluída' : 'Em andamento',
      dateLabel: dataAv && dayjs(dataAv).isValid() ? dayjs(dataAv).format('DD/MM/YYYY') : '—',
      route: `/avaliacoes/editar/${a.id}/identificacao`,
    })
  }

  recent.sort((a, b) => {
    if (a.dateLabel === '—' && b.dateLabel === '—') return 0
    if (a.dateLabel === '—') return 1
    if (b.dateLabel === '—') return -1
    const da = dayjs(a.dateLabel, 'DD/MM/YYYY')
    const db = dayjs(b.dateLabel, 'DD/MM/YYYY')
    return db.valueOf() - da.valueOf()
  })

  return {
    metrics,
    alerts: alerts.slice(0, 5),
    recent: recent.slice(0, 6),
    coberturaPercent,
    alunosSemEstudo,
    alunosSemPaee,
    relatosMes,
    presencaMesPercent,
    paeeAtivos,
    totalEstudosCaso: input.estudosCaso.length,
    totalFusoes,
    charts: computeDashboardCharts({
      alunos: input.alunos,
      planejamentos: input.planejamentos,
      avaliacoes: input.avaliacoes,
      estudosCaso: input.estudosCaso,
      relatos: input.relatos,
      relatosMesLista,
      ref,
      completionByStep: input.completionByStep ?? {},
    }),
  }
}
