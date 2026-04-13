import type { Atividade } from '@/types/atividades'

export const NIVEIS_AVALIACAO: { value: 'Facil' | 'Medio' | 'Dificil'; label: string }[] = [
  { value: 'Facil', label: 'Fácil' },
  { value: 'Medio', label: 'Médio' },
  { value: 'Dificil', label: 'Difícil' },
]

export const ETAPAS_ENSINO: { value: string; label: string }[] = [
  { value: '1', label: 'Educação Infantil' },
  { value: '2', label: 'Ens. Fund. I — Anos Iniciais' },
  { value: '3', label: 'Ens. Fund. II — Anos Finais' },
  { value: '4', label: 'Ensino Médio' },
]

export function labelNivelDificuldade(nivel: string): string {
  return NIVEIS_AVALIACAO.find((n) => n.value === nivel)?.label ?? nivel
}

export function labelEtapaValor(valor: string | undefined): string | undefined {
  if (!valor) return undefined
  return ETAPAS_ENSINO.find((e) => e.value === valor)?.label ?? valor
}

/** Etapa(s) de ensino da atividade (min/máx podem coincidir ou diferir). */
export function resumoEtapaEnsino(atividade: Pick<Atividade, 'etapaMin' | 'etapaMax'>): string {
  const lMin = labelEtapaValor(atividade.etapaMin)
  const lMax = labelEtapaValor(atividade.etapaMax)
  if (lMin && lMax && lMin !== lMax) return `${lMin} — ${lMax}`
  return lMin ?? lMax ?? '—'
}
