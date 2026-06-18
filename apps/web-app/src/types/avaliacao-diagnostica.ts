export type NivelRealizacao =
  | 'Autonomia'
  | 'ComAjuda'
  | 'NaoRealizou'
  | 'NaoAvaliado'

/** Perfil agregado (substitui percentual numérico legado em diagnósticos persistidos). */
export type NivelPerfilAutonomia =
  | 'NaoAvaliado'
  | 'PredominioDependencia'
  | 'AutonomiaMediada'
  | 'PredominioAutonomia'

export interface AlunoPerfilAutonomiaResumo {
  alunoId: number
  nomeCompleto: string
  nivelPerfilAutonomia: NivelPerfilAutonomia | string
  rotuloExibicao: string
  sugestaoPaee: string
  /** Proporção de atividades em "Autonomia" entre as já avaliadas; ausente se não houver base. */
  percentualAutonomiaCalculado?: number | null
  habilidadesFortes?: string | null
  habilidadesAReenforcar?: string | null
}

export interface AvaliacaoDiagnosticaResumo {
  id: number
  titulo: string
  objetivo?: string
  dataAplicacao: string
  escolaId: number
  escolaNome?: string
  quantidadeAlunos: number
  quantidadeBlocos: number
  concluida: boolean
  status: 'Pendente' | 'EmAndamento' | 'Concluida' | 'Cancelada'
  professorId?: number | null
  createdAt: string
  updatedAt: string
}

export interface BlocoSelecionado {
  blocoId: number
  atividadeIds: number[]
}

export interface BlocoComAtividadesDetalhe {
  id: number
  titulo: string
  ordem: number
  observacao?: string
  icone?: string
  quantidadeAtividades: number
  atividades: Array<{
    id: number
    titulo: string
    enunciado: string
    imagemUrl?: string
    nivel: string
    etapaMin?: string
    etapaMax?: string
    habilidadeIds?: number[]
  }>
}

export interface AvaliacaoDiagnosticaDetalhada {
  id: number
  titulo: string
  objetivo?: string
  dataAplicacao: string
  escolaId?: number | null
  /** Preenchido pela API ao buscar detalhe (PDF / telas). */
  escolaNome?: string
  escola: { id: number; nome: string }
  alunoIds?: number[]
  alunos?: Array<{
    id: number
    nomeCompleto: string
    status: 'Pendente' | 'EmAndamento' | 'Concluida'
    dataConclusao?: string
  }>
  /** API retorna alunosParticipantes com Aluno aninhado */
  alunosParticipantes?: Array<{
    alunoId: number
    aluno?: { id: number; nomeCompleto?: string; nome?: string }
  }>
  blocos?: Array<{
    id: number
    titulo: string
    ordemApresentacao: number
    quantidadeAtividades: number
    icone?: string
    status?: 'Pendente' | 'EmAndamento' | 'Concluido'
  }>
  blocosComAtividades?: BlocoComAtividadesDetalhe[]
  /** Visão agregada por aluno (níveis discretos + sugestão PAEE); calculado na API a partir dos lançamentos. */
  perfisAutonomiaPorAluno?: AlunoPerfilAutonomiaResumo[]
  registrosDesempenho?: Array<{
    id?: number
    alunoId: number
    atividadeId?: number
    nivelRealizacao: string
    observacao?: string
    dataRegistro?: string
  }>
  observacoesAlunos?: Array<{
    alunoId: number
    observacao?: string
  }>
  concluida: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAvaliacaoDiagnosticaRequest {
  id?: number
  titulo: string
  objetivo?: string
  dataAplicacao?: string
  escolaId?: number | null
  alunoIds: number[]
  blocoIds?: number[]
  blocos?: BlocoSelecionado[]
  concluida?: boolean
}

export interface CreateAvaliacaoDiagnosticaResponse {
  id: number
  titulo: string
  message?: string
  sucesso: boolean
}

export interface DesempenhoAtividade {
  id?: number
  avaliacaoDiagnosticaId: number
  atividadeId: number
  alunoId: number
  nivelRealizacao: NivelRealizacao
  observacao?: string
  dataRegistro?: string
}

export interface RegistrarDesempenhoItemRequest {
  alunoId: number
  atividadeId: number
  nivelRealizacao: NivelRealizacao
  observacao?: string
}

export interface RegistrarObservacaoAlunoRequest {
  alunoId: number
  observacao?: string
}

export interface RegistrarDesempenhoBatchRequest {
  avaliacaoDiagnosticaId: number
  itens: RegistrarDesempenhoItemRequest[]
  observacoesAlunos?: RegistrarObservacaoAlunoRequest[]
}

export interface DesempenhoHistoricoItem {
  id: number
  avaliacaoDiagnosticaId: number
  alunoId: number
  atividadeId: number
  nivelRealizacao: NivelRealizacao
  observacao?: string
  dataRegistro: string
}

export interface ObservacaoAlunoHistoricoItem {
  id: number
  avaliacaoDiagnosticaId: number
  alunoId: number
  observacao: string
  dataRegistro: string
}

export interface DesempenhoHistoricoResponse {
  itens: DesempenhoHistoricoItem[]
  observacoesAlunos: ObservacaoAlunoHistoricoItem[]
}

export interface DiagnosticoFinal {
  id: number
  avaliacaoDiagnosticaId: number
  alunoId: number
  aluno: { id: number; nomeCompleto: string }
  resumo: string
  nivelPerfilAutonomia: NivelPerfilAutonomia | string
  recomendacoes: string
  habilidadesFortes?: string
  habilidadesAReenforcar?: string
  geradoEm: string
  createdAt: string
  updatedAt: string
}

export interface DiagnosticoResumo {
  id: number
  alunoNome: string
  nivelPerfilAutonomia: NivelPerfilAutonomia | string
  rotuloExibicao?: string
  resumoCurto: string
  geradoEm: string
}
