import { api } from '../services/auth';
import { 
  AvaliacaoDiagnosticaResumo,
  CreateAvaliacaoDiagnosticaRequest,
  CreateAvaliacaoDiagnosticaResponse,
  RegistrarDesempenhoBatchRequest,
  DiagnosticoFinal,
  AvaliacaoDiagnosticaEdicaoResponse
} from '../types/avaliacao-diagnostica';

// Busca lista resumida de avaliações diagnósticas (para tela de listagem)
export const buscarAvaliacoesDiagnosticas = async (): Promise<AvaliacaoDiagnosticaResumo[]> => {
  try {
    const response = await api.get('/avaliacaodiagnostica/buscarTodos');

    const lista = response.data?.objeto;

    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    console.error('Erro ao buscar avaliações diagnósticas:', error);
    return [];
  }
};


// Busca detalhes completos de uma avaliação específica (para tela de detalhes)
export const buscarAvaliacaoPorId = async (
  id: number
): Promise<AvaliacaoDiagnosticaEdicaoResponse> => {
  try {
    const response = await api.get(`/avaliacaodiagnostica/buscar/${id}`);
    return response.data; // ✅ retorna o ServiceResponse completo
  } catch (error) {
    console.error(`Erro ao buscar detalhes da avaliação ${id}:`, error);
    throw error;
  }
};

// Cria uma nova avaliação diagnóstica
export const criarAvaliacaoDiagnostica = async (
  dados: CreateAvaliacaoDiagnosticaRequest
): Promise<any> => {
  try {
    
    const response = await api.post('/avaliacaodiagnostica/cadastro', dados);
    return response.data.objeto; // backend retorna ServiceResponse com .objeto (detail)
  } catch (error) {
    console.error('Erro ao criar avaliação diagnóstica:', error);
    throw error;
  }
};

export const atualizarAvaliacaoDiagnostica = async (id: number, dados: any): Promise<any> => {
  try {
    const response = await api.put(`/avaliacaodiagnostica/atualizar/${id}`, dados);
    return response.data.objeto; // ou response.data conforme sua resposta
  } catch (error) {
    console.error('Erro ao atualizar avaliação diagnóstica:', error);
    throw error;
  }
};

// Registra múltiplos desempenhos de uma vez (batch - tela de registro)
export const registrarDesempenhoBatch = async (
  dados: RegistrarDesempenhoBatchRequest
): Promise<{ mensagem: string }> => {
  try {
    const response = await api.post('/avaliacaodiagnostica/desempenhos/batch', dados);
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
    const response = await api.get(`/avaliacaodiagnostica/diagnosticos-finais/${avaliacaoId}/${alunoId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar diagnóstico final (avaliação ${avaliacaoId}, aluno ${alunoId}):`, error);
    throw error;
  }
};

// Finaliza a avaliação (opcional - marca como concluída e gera diagnósticos se necessário)
export const finalizarAvaliacao = async (id: number): Promise<{ mensagem: string }> => {
  try {
    const response = await api.post(`/avaliacaodiagnostica/${id}/finalizar`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao finalizar avaliação ${id}:`, error);
    throw error;
  }
};

/**
 * Gera o PDF da avaliação diagnóstica e retorna como string base64
 * @param avaliacaoId ID da avaliação já salva
 * @returns String base64 pronta para usar em data URI (application/pdf;base64,...)
 * @throws Erro com mensagem amigável
 */
export const gerarPdfBase64 = async (avaliacaoId: number): Promise<string> => {
  try {
    const response = await api.get(`/avaliacaodiagnostica/gerar-pdf/${avaliacaoId}`, {
      responseType: 'blob', // essencial para receber arquivo binário
    });

    const blob = response.data as Blob;

    // Converte Blob → Base64 (lógica técnica fica aqui no service)
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Falha ao converter PDF para base64'));
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    console.error('[gerarPdfBase64] Erro ao gerar PDF:', error);

    const mensagem =
      error.response?.data?.mensagem ||
      error.response?.data?.mensagens?.[0] ||
      error.message ||
      'Não foi possível gerar ou carregar o PDF da avaliação';

    throw new Error(mensagem);
  }
};