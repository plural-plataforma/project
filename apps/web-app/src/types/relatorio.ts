/** Alinhado ao enum `RelatorioTipoPeriodo` da API. */
export type RelatorioTipoPeriodoCodigo = 0 | 1

export const RELATORIO_TIPO_PERIODO_OPCOES: RelatorioTipoPeriodoCodigo[] = [0, 1]

export const RELATORIO_TIPO_PERIODO_LABELS: Record<RelatorioTipoPeriodoCodigo, string> = {
  0: 'Trimestral',
  1: 'Semestral',
}

/** Alinhado ao enum `RelatorioStatus` da API. */
export type RelatorioStatusCodigo = 0 | 1 | 2 | 3

export const RELATORIO_STATUS_LABELS: Record<RelatorioStatusCodigo, string> = {
  0: 'Rascunho',
  1: 'Finalizado',
  2: 'Gerando',
  3: 'Erro na geração',
}

export const RELATORIO_STATUS_BADGE_VARIANT: Record<RelatorioStatusCodigo, 'amber' | 'success' | 'default' | 'danger'> = {
  0: 'amber',
  1: 'success',
  2: 'default',
  3: 'danger',
}

/** Alinhado ao enum `RelatorioSecaoChave` da API — Identificação fica de fora (vem do cadastro do aluno). */
export type RelatorioSecaoChaveCodigo = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

export const RELATORIO_SECAO_ORDEM: RelatorioSecaoChaveCodigo[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

/**
 * Texto exato do template "RELATÓRIO PEDAGÓGICO DO ATENDIMENTO EDUCACIONAL ESPECIALIZADO"
 * fornecido pela cliente (15 seções — a 1ª, Identificação, fica fora daqui, ver `RELATORIO_SECAO_NUMERO`).
 */
export const RELATORIO_SECAO_LABELS: Record<RelatorioSecaoChaveCodigo, string> = {
  0: 'Contextualização do atendimento',
  1: 'Potencialidades, interesses e formas de aprendizagem',
  2: 'Comunicação e linguagem',
  3: 'Aspectos cognitivos e funções executivas',
  4: 'Aspectos acadêmicos e acesso ao currículo',
  5: 'Interação social e participação',
  6: 'Autonomia e habilidades funcionais',
  7: 'Aspectos motores, sensoriais e de acessibilidade',
  8: 'Barreiras identificadas',
  9: 'Estratégias, recursos e apoios utilizados',
  10: 'Evolução observada no período',
  11: 'Necessidades que permanecem',
  12: 'Encaminhamentos e recomendações pedagógicas',
  13: 'Síntese conclusiva',
}

/** Numeração do template (1 = Identificação, tratada à parte; as 14 seções aqui vão de 2 a 15). */
export const RELATORIO_SECAO_NUMERO: Record<RelatorioSecaoChaveCodigo, number> = {
  0: 2,
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 8,
  7: 9,
  8: 10,
  9: 11,
  10: 12,
  11: 13,
  12: 14,
  13: 15,
}

export interface RelatorioSecao {
  secaoChave: RelatorioSecaoChaveCodigo
  textoGerado: string | null
  textoEditado: string | null
  notasManuais: string | null
  geradoEm: string | null
  editadoEm: string | null
  informacaoInsuficiente: boolean
}

export interface Relatorio {
  id: number
  alunoId: number
  alunoNome: string
  /** ISO yyyy-mm-dd — vem direto do cadastro do aluno, não passa por IA. */
  alunoDataNascimento?: string | null
  alunoAno?: string | null
  escolaNomeInstituicao?: string | null
  professorNomeCompleto?: string | null
  alunoFrequenciaSemanalAtendimento?: number | null
  alunoDuracaoAtendimentoMinutos?: number | null
  /** Alinhado ao enum `TipoAtendimentoAee` da API — ver `labelTipoAtendimentoAee` em `types/aluno.ts`. */
  alunoTipoAtendimentoAee?: number | null
  dataInicio: string
  dataFim: string
  tipoPeriodo: RelatorioTipoPeriodoCodigo
  status: RelatorioStatusCodigo
  createdAt: string
  updatedAt: string
  secoes: RelatorioSecao[]
}

export interface RelatorioResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Relatorio | null
  listaObjetos: Relatorio[]
}

/** Versão enxuta pra listagem — sem as seções (ver `RelatorioResumoDTO` na API). */
export interface RelatorioResumo {
  id: number
  alunoId: number
  alunoNome: string
  alunoAno?: string | null
  escolaId?: number | null
  escolaNomeInstituicao?: string | null
  dataInicio: string
  dataFim: string
  tipoPeriodo: RelatorioTipoPeriodoCodigo
  status: RelatorioStatusCodigo
  createdAt: string
  updatedAt: string
}

export interface RelatorioResumoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: RelatorioResumo | null
  listaObjetos: RelatorioResumo[]
}

export interface RelatorioPreviewInsumos {
  alunoNome: string
  temEstudoCaso: boolean
  quantidadePlanejamentosVigentes: number
  quantidadeRelatosNoPeriodo: number
  quantidadeRelatosComPresenca: number
  quantidadeAvaliacoesNoPeriodo: number
  quantidadeLancamentosDesempenho: number
  periodoElegivelParaComparacaoEvolucao: boolean
  avisos: string[]
}

export interface RelatorioPreviewInsumosResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: RelatorioPreviewInsumos | null
}
