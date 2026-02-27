// src/types/avaliacao-diagnostica.ts

/**
 * Níveis de realização que o professor registra para cada atividade/aluno
 */
export type NivelRealizacao = 
  | 'Autonomia'          // Fez sozinho, sem ajuda
  | 'ComAjuda'           // Precisou de ajuda
  | 'NaoRealizou'        // Não conseguiu realizar
  | 'NaoAvaliado';       // Ainda não avaliado

/**
 * Resumo de uma avaliação diagnóstica (usado na lista "Minhas Avaliações")
 */
export interface AvaliacaoDiagnosticaResumo {
  id: number;
  titulo: string;
  objetivo?: string;
  dataAplicacao: string;          // ISO date "2026-01-27"
  escolaId?: number;
  escolaNome?: string;            // Opcional, vindo do backend
  quantidadeAlunos: number;
  quantidadeBlocos: number;
  concluida: boolean;
  status: 'Pendente' | 'EmAndamento' | 'Concluida' | 'Cancelada';
  createdAt: string;
  updatedAt: string;
}

/**
 * Detalhes completos de uma avaliação (para tela de detalhes)
 */
export interface AvaliacaoDiagnosticaDetalhada {
  id: number;
  titulo: string;
  objetivo?: string;
  dataAplicacao: string;
  escola: {
    id: number;
    nome: string;
  };
  alunos: Array<{
    id: number;
    nomeCompleto: string;
    status: 'Pendente' | 'EmAndamento' | 'Concluida';
    dataConclusao?: string;
  }>;
  blocos: Array<{
    id: number;
    titulo: string;
    ordemApresentacao: number;
    quantidadeAtividades: number;
    icone?: string;
    status?: 'Pendente' | 'EmAndamento' | 'Concluido';
  }>;
  concluida: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO auxiliar para bloco + atividades selecionadas
 */
export type BlocoSelecionadoDTO = {
  blocoId: number;
  atividadeIds: number[];
};

/**
 * Dados necessários para CRIAR uma nova avaliação diagnóstica
 */
export interface CreateAvaliacaoDiagnosticaRequest {
  titulo: string;
  objetivo?: string;
  dataAplicacao?: string;          // ISO date, opcional (usa hoje se não vier)
  escolaId?: number| null;
  alunoIds: number[];              // IDs dos alunos selecionados
  blocos: BlocoSelecionadoDTO[];   // Blocos com atividades específicas selecionadas
}

/**
 * Resposta esperada após criar uma avaliação
 */
export interface CreateAvaliacaoDiagnosticaResponse {
  id: number;
  titulo: string;
  message?: string;
  sucesso: boolean;
}

/**
 * Item de registro de desempenho (por atividade e aluno)
 */
export interface DesempenhoAtividade {
  id?: number;                      // gerado pelo backend após salvar
  avaliacaoDiagnosticaId: number;
  atividadeId: number;
  alunoId: number;
  nivelRealizacao: NivelRealizacao;
  observacao?: string;
  dataRegistro?: string;
}

/**
 * Request para registrar múltiplos desempenhos de uma vez (batch)
 */
export interface RegistrarDesempenhoBatchRequest {
  avaliacaoDiagnosticaId: number;
  itens: Array<{
    alunoId: number;
    atividadeId: number;
    nivelRealizacao: NivelRealizacao;
    observacao?: string;
  }>;
}

/**
 * Diagnóstico final gerado para um aluno após registrar desempenhos
 */
export interface DiagnosticoFinal {
  id: number;
  avaliacaoDiagnosticaId: number;
  alunoId: number;
  aluno: {
    id: number;
    nomeCompleto: string;
  };
  resumo: string;                        // ex: "Dificuldade moderada em reconhecimento de letras"
  percentualAutonomia: number;           // 0 a 100
  recomendacoes: string;
  habilidadesFortes?: string;
  habilidadesAReenforcar?: string;
  geradoEm: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resumo de diagnóstico para lista (ex: tela de resultados)
 */
export interface DiagnosticoResumo {
  id: number;
  alunoNome: string;
  percentualAutonomia: number;
  resumoCurto: string;
  geradoEm: string;
}