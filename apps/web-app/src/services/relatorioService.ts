import { api } from '@/api/http'
import type {
  Relatorio,
  RelatorioResponse,
  RelatorioResumo,
  RelatorioResumoResponse,
  RelatorioPreviewInsumos,
  RelatorioPreviewInsumosResponse,
  RelatorioSecaoChaveCodigo,
  RelatorioStatusCodigo,
  RelatorioTipoPeriodoCodigo,
} from '@/types/relatorio'

// alunoId ausente traz os relatórios de todos os alunos do professor (tela central de
// Relatórios); informado, filtra só daquele aluno (card no perfil do aluno).
export const listarRelatorios = async (params: {
  alunoId?: number
  escolaId?: number
  tipoPeriodo?: RelatorioTipoPeriodoCodigo
  status?: RelatorioStatusCodigo
  dataInicio?: string
  dataFim?: string
}): Promise<RelatorioResumo[]> => {
  const response = await api.get<RelatorioResumoResponse>('/Relatorio/listar', { params })
  if (response.data.sucesso) return response.data.listaObjetos ?? []
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao listar relatórios pedagógicos')
}

export const previewInsumosRelatorio = async (params: {
  alunoId: number
  dataInicio: string
  dataFim: string
}): Promise<RelatorioPreviewInsumos> => {
  const response = await api.get<RelatorioPreviewInsumosResponse>('/Relatorio/preview-insumos', { params })
  if (response.data.sucesso && response.data.objeto) return response.data.objeto
  throw new Error(response.data.mensagens?.join(', ') || 'Não foi possível montar a prévia dos insumos')
}

interface RelatorioGeracaoResultado {
  relatorio: Relatorio
  sucesso: boolean
  mensagem: string
}

// Cadastro e "gerar novamente" podem devolver sucesso=false mesmo com o relatório salvo
// (falha só na chamada de IA) — o objeto vem preenchido nos dois casos, então não lançamos
// erro aqui; quem chama decide como avisar o usuário e ainda assim navegar pro relatório.
async function extrairResultadoGeracao(
  response: { data: RelatorioResponse },
  mensagemPadrao: string
): Promise<RelatorioGeracaoResultado> {
  if (!response.data.objeto) {
    throw new Error(response.data.mensagens?.join(', ') || mensagemPadrao)
  }
  return {
    relatorio: response.data.objeto,
    sucesso: response.data.sucesso,
    mensagem: response.data.mensagens?.join(', ') || '',
  }
}

export const cadastrarRelatorio = async (payload: {
  alunoId: number
  dataInicio: string
  dataFim: string
  tipoPeriodo: RelatorioTipoPeriodoCodigo
}): Promise<RelatorioGeracaoResultado> => {
  const response = await api.post<RelatorioResponse>('/Relatorio/cadastro', payload)
  return extrairResultadoGeracao(response, 'Falha ao gerar o relatório pedagógico')
}

export const gerarNovamenteRelatorio = async (id: number): Promise<RelatorioGeracaoResultado> => {
  const response = await api.post<RelatorioResponse>(`/Relatorio/${id}/gerar-novamente`)
  return extrairResultadoGeracao(response, 'Falha ao gerar o relatório novamente')
}

export const buscarRelatorioPorId = async (id: number): Promise<Relatorio> => {
  const response = await api.get<RelatorioResponse>(`/Relatorio/${id}`)
  if (response.data.sucesso && response.data.objeto) return response.data.objeto
  throw new Error(response.data.mensagens?.join(', ') || 'Relatório não encontrado')
}

export const atualizarSecaoRelatorio = async (
  id: number,
  payload: { secaoChave: RelatorioSecaoChaveCodigo; textoEditado?: string | null; notasManuais?: string | null }
): Promise<Relatorio> => {
  const response = await api.patch<RelatorioResponse>(`/Relatorio/${id}/secoes`, payload)
  if (response.data.sucesso && response.data.objeto) return response.data.objeto
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao salvar a seção')
}

export const finalizarRelatorio = async (id: number): Promise<Relatorio> => {
  const response = await api.post<RelatorioResponse>(`/Relatorio/${id}/finalizar`)
  if (response.data.sucesso && response.data.objeto) return response.data.objeto
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao finalizar o relatório')
}

export const reabrirRelatorio = async (id: number): Promise<Relatorio> => {
  const response = await api.post<RelatorioResponse>(`/Relatorio/${id}/reabrir`)
  if (response.data.sucesso && response.data.objeto) return response.data.objeto
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao reabrir o relatório')
}

export const duplicarRelatorio = async (id: number): Promise<Relatorio> => {
  const response = await api.post<RelatorioResponse>(`/Relatorio/${id}/duplicar`)
  if (response.data.sucesso && response.data.objeto) return response.data.objeto
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao duplicar o relatório')
}
