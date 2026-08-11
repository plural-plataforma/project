import { api } from '@/api/http'

export interface DocumentoBiblioteca {
  id: number
  nome: string
  categoria?: string | null
  nomeArquivoOriginal: string
  tamanhoBytes: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

interface ServiceResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T | null
}

export async function listarBibliotecaModelos(): Promise<DocumentoBiblioteca[]> {
  const { data } = await api.get<ServiceResponse<DocumentoBiblioteca[]>>('/biblioteca-modelos')
  if (!data.sucesso) throw new Error(data.mensagens?.join(', ') || 'Falha ao carregar biblioteca de modelos')
  return data.objeto ?? []
}

export async function baixarDocumentoBiblioteca(documento: DocumentoBiblioteca): Promise<void> {
  const response = await api.get(`/biblioteca-modelos/${documento.id}/download`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = documento.nomeArquivoOriginal
  link.click()
  URL.revokeObjectURL(url)
}
