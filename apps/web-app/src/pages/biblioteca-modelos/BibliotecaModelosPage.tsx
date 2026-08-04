import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookBookmark,
  DownloadSimple,
  FileDoc,
  GridFour,
  ListBullets,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import {
  baixarDocumentoBiblioteca,
  listarBibliotecaModelos,
  type DocumentoBiblioteca,
} from '@/services/bibliotecaModelosService'

type Visualizacao = 'grade' | 'lista'
const CHAVE_VISUALIZACAO = 'biblioteca-modelos:visualizacao'

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function lerVisualizacaoSalva(): Visualizacao {
  if (typeof window === 'undefined') return 'grade'
  const salvo = window.localStorage.getItem(CHAVE_VISUALIZACAO)
  return salvo === 'lista' ? 'lista' : 'grade'
}

export default function BibliotecaModelosPage() {
  const { success, error: showError } = useToast()
  const [busca, setBusca] = useState('')
  const [visualizacao, setVisualizacao] = useState<Visualizacao>(lerVisualizacaoSalva)

  function mudarVisualizacao(v: Visualizacao) {
    setVisualizacao(v)
    window.localStorage.setItem(CHAVE_VISUALIZACAO, v)
  }

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou categoria..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          <button
            type="button"
            aria-label="Ver em blocos"
            aria-pressed={visualizacao === 'grade'}
            onClick={() => mudarVisualizacao('grade')}
            className={cn(
              'flex items-center justify-center rounded-md p-1.5 transition-colors',
              visualizacao === 'grade'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <GridFour size={18} />
          </button>
          <button
            type="button"
            aria-label="Ver em lista"
            aria-pressed={visualizacao === 'lista'}
            onClick={() => mudarVisualizacao('lista')}
            className={cn(
              'flex items-center justify-center rounded-md p-1.5 transition-colors',
              visualizacao === 'lista'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <ListBullets size={18} />
          </button>
        </div>
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
          <CardContent>
            {visualizacao === 'grade' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {documentosFiltrados.map((documento) => (
                  <button
                    key={documento.id}
                    type="button"
                    onClick={() => void baixar(documento)}
                    title={`Baixar ${documento.nome}`}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    <div className="relative">
                      <FileDoc size={40} weight="duotone" className="text-primary" />
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <DownloadSimple size={12} weight="bold" />
                      </span>
                    </div>
                    <p className="line-clamp-2 w-full text-sm font-medium text-foreground">{documento.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {documento.categoria ? `${documento.categoria} · ` : ''}
                      {formatarTamanho(documento.tamanhoBytes)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {documentosFiltrados.map((documento) => (
                  <div
                    key={documento.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileDoc size={24} weight="duotone" className="shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">{documento.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {documento.categoria ? `${documento.categoria} · ` : ''}
                          {formatarTamanho(documento.tamanhoBytes)}
                        </p>
                      </div>
                    </div>
                    <Button type="button" size="sm" onClick={() => void baixar(documento)}>
                      <DownloadSimple size={16} />
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
