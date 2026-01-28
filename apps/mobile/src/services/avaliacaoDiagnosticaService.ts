import { api } from '../services/auth';
import { 
  AvaliacaoDiagnosticaResumo,
  AvaliacaoDiagnosticaDetalhada,
  CreateAvaliacaoDiagnosticaRequest,
  CreateAvaliacaoDiagnosticaResponse,
  RegistrarDesempenhoBatchRequest,
  DiagnosticoFinal
} from '../types/avaliacao-diagnostica';

// Busca lista resumida de avaliações diagnósticas (para tela de listagem)
export const buscarAvaliacoesDiagnosticas = async (): Promise<AvaliacaoDiagnosticaResumo[]> => {
  try {
    const response = await api.get('/api/avaliacoes-diagnosticas');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar avaliações diagnósticas:', error);
    throw error; // Pode ser tratado no componente com toast ou retry
  }
};

// Busca detalhes completos de uma avaliação específica (para tela de detalhes)
export const buscarAvaliacaoPorId = async (id: number): Promise<AvaliacaoDiagnosticaDetalhada> => {
  try {
    const response = await api.get(`/api/avaliacoes-diagnosticas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes da avaliação ${id}:`, error);
    throw error;
  }
};

// Cria uma nova avaliação diagnóstica
export const criarAvaliacaoDiagnostica = async (
  dados: CreateAvaliacaoDiagnosticaRequest
): Promise<CreateAvaliacaoDiagnosticaResponse> => {
  try {
    const response = await api.post('/api/avaliacoes-diagnosticas', dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar avaliação diagnóstica:', error);
    throw error;
  }
};

// Registra múltiplos desempenhos de uma vez (batch - tela de registro)
export const registrarDesempenhoBatch = async (
  dados: RegistrarDesempenhoBatchRequest
): Promise<{ mensagem: string }> => {
  try {
    const response = await api.post('/api/desempenhos/batch', dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao registrar desempenhos em batch:', error);
    throw error;
  }
};

// Gera ou busca o diagnóstico final para um aluno em uma avaliação
export const buscarDiagnosticoFinal = async (
  avaliacaoId: number,
  alunoId: number
): Promise<DiagnosticoFinal> => {
  try {
    const response = await api.get(`/api/diagnosticos-finais/${avaliacaoId}/${alunoId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar diagnóstico final (avaliação ${avaliacaoId}, aluno ${alunoId}):`, error);
    throw error;
  }
};

// Finaliza a avaliação (opcional - marca como concluída e gera diagnósticos se necessário)
export const finalizarAvaliacao = async (id: number): Promise<{ mensagem: string }> => {
  try {
    const response = await api.post(`/api/avaliacoes-diagnosticas/${id}/finalizar`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao finalizar avaliação ${id}:`, error);
    throw error;
  }
};