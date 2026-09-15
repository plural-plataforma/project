import { api } from '@/api/http'

const ATIVIDADE_BASE_PATH = '/atividades'

export interface AtividadeImagemBaixada {
  bytes: Uint8Array
  contentType: string | null
}

/**
 * Baixa a imagem da atividade pela API. O host externo de imagens não envia cabeçalho CORS,
 * então o navegador não consegue ler os bytes direto da URL — sem este proxy a exportação
 * Word sai com "(Imagem não disponível)".
 */
export const baixarImagemAtividade = async (
  atividadeId: number
): Promise<AtividadeImagemBaixada | null> => {
  try {
    const response = await api.get<ArrayBuffer>(`${ATIVIDADE_BASE_PATH}/${atividadeId}/imagem`, {
      responseType: 'arraybuffer',
    })
    const bytes = new Uint8Array(response.data)
    if (bytes.length === 0) return null
    const contentType = response.headers['content-type']
    return { bytes, contentType: typeof contentType === 'string' ? contentType : null }
  } catch {
    return null
  }
}
