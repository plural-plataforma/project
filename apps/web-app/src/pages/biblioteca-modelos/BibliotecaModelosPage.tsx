import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookBookmark, DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import {
  baixarDocumentoBiblioteca,
  listarBibliotecaModelos,
  type DocumentoBiblioteca,
} from '@/services/bibliotecaModelosService'

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BibliotecaModelosPage() {
  const { success, error: showError } = useToast()
  const [busca, setBusca] = useState('')

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['biblioteca-modelos'],
    queryFn: listarBibliotecaModelos,
  })

  const documentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return documentos
    return documentos.filter(
      (doc) =>
        doc.nome.toLowerCase().includes(termo) ||
        (doc.categoria ?? '').toLowerCase().includes(termo)
    )
  }, [documentos, busca])

  async function baixar(documento: DocumentoBiblioteca) {
    try {
      await baixarDocumentoBiblioteca(documento)
      success('Download iniciado', `${documento.nome} baixado com sucesso.`)
    } catch (e: unknown) {
      const fb = getApiErrorFeedback(e)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de Modelos"
        description="Modelos de documento prontos para download — entrevistas, termos, planos e fichas usados no AEE."
      />

      <div className="relative max-w-sm">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou categoria..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : documentosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {documentos.length === 0
                ? 'Nenhum modelo disponível ainda.'
                : 'Nenhum modelo encontrado para essa busca.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookBookmark size={20} />
              {documentosFiltrados.length} modelo{documentosFiltrados.length !== 1 ? 's' : ''} disponível
              {documentosFiltrados.length !== 1 ? 'is' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documentosFiltrados.map((documento) => (
              <div
                key={documento.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{documento.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {documento.categoria ? `${documento.categoria} · ` : ''}
                    {formatarTamanho(documento.tamanhoBytes)}
                  </p>
                </div>
                <Button type="button" size="sm" onClick={() => void baixar(documento)}>
                  <DownloadSimple size={16} />
                  Baixar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
