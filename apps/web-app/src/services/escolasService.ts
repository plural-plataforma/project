import { api } from '@/api/http'
import type { Escola, EscolasResponse } from '@/types/escolas'

export const buscarEscolas = async (): Promise<Escola[]> => {
  const response = await api.get<EscolasResponse>('/Escola/buscar')
  if (response.data.sucesso) {
    if (response.data.listaObjetos?.length) return response.data.listaObjetos
    if (Array.isArray(response.data.objeto)) return response.data.objeto
  }
  return []
}

export const buscarEscolaPorId = async (id: number): Promise<Escola> => {
  const response = await api.get<EscolasResponse>(`/Escola/buscar/${id}`)
  if (response.data.sucesso && response.data.objeto) {
    if (Array.isArray(response.data.objeto) && response.data.objeto.length > 0) {
      return response.data.objeto[0]
    }
    return response.data.objeto as unknown as Escola
  }
  throw new Error('Escola não encontrada')
}

export const salvarEscola = async (data: Partial<Escola>): Promise<Escola> => {
  const response = data.id
    ? await api.patch<EscolasResponse>('/Escola/atualizar', data)
    : await api.post<EscolasResponse>('/Escola/cadastro', data)

  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao salvar a escola')
  }

  // Tenta extrair o objeto diretamente da resposta
  if (Array.isArray(response.data.objeto) && response.data.objeto.length > 0) {
    return response.data.objeto[0]
  }
  if (response.data.objeto && !Array.isArray(response.data.objeto)) {
    return response.data.objeto as unknown as Escola
  }
  if (response.data.listaObjetos?.length) {
    return response.data.listaObjetos[0]
  }

  // Edição: data.id já é o id correto
  if (data.id) return data as Escola

  // Criação: API retorna sucesso=true mas objeto=null.
  // Busca todas as escolas e localiza a recém-criada pelo nome para obter o id real.
  const todas = await buscarEscolas()
  const criada = todas.find(
    (e) => e.nomeInstituicao.trim().toLowerCase() === (data.nomeInstituicao ?? '').trim().toLowerCase()
  )
  if (criada) return criada

  throw new Error('Escola criada mas ID não encontrado. Recarregue a página.')
}
