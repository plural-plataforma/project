import { api } from '@/api/http'
import type {
  Habilidade,
  HabilidadeAtualizarPayload,
  HabilidadeCadastroPayload,
  HabilidadeResponse,
  HabilidadeUnicaResponse,
} from '@/types/habilidade'

export const buscarHabilidades = async (): Promise<Habilidade[]> => {
  const response = await api.get<HabilidadeResponse>('/Habilidade/buscar')
  if (Array.isArray(response.data.objeto)) return response.data.objeto
  return []
}

export const criarHabilidade = async (payload: HabilidadeCadastroPayload): Promise<Habilidade> => {
  const response = await api.post<HabilidadeUnicaResponse>('/Habilidade/cadastro', payload)
  if (!response.data.sucesso || !response.data.objeto) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao criar habilidade')
  }
  return response.data.objeto
}

export const excluirHabilidade = async (id: number): Promise<void> => {
  const response = await api.delete<{ sucesso: boolean; mensagens?: string[] }>(`/Habilidade/excluir/${id}`)
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao excluir habilidade')
  }
}

export const atualizarHabilidade =async (payload: HabilidadeAtualizarPayload): Promise<void> => {
  const response = await api.patch<{ sucesso: boolean; mensagens?: string[] }>('/Habilidade/atualizar', payload)
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar habilidade')
  }
}
