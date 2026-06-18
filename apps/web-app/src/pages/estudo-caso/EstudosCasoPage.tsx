import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Article, CalendarBlank, MagnifyingGlass, Plus, User } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AnimatedList,
  AnimatedListItem,
  DownloadFormatMenu,
  FilterEmptyState,
  ListFilterBar,
  ListPageLayout,
  ListResultToolbar,
  ResourceListCard,
} from '@/components/lists'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { baixarEstudoCasoPdf, baixarEstudoCasoWord } from '@/lib/baixarEstudoCaso'
import { sortByField } from '@/lib/utils'
import { buscarAlunos } from '@/services/alunoService'
import { listarEstudosCaso } from '@/services/estudoCasoService'
import { EstudoCasoDetalheDialog } from '@/pages/estudo-caso/EstudoCasoDetalheDialog'

export default function EstudosCasoPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [filtroAluno, setFiltroAluno] = useState<string>('all')
  const [detalheId, setDetalheId] = useState<number | null>(null)

  const { data: alunos = [] } = useQuery({ queryKey: ['alunos'], queryFn: buscarAlunos })

  const { data: estudos = [], isLoading } = useQuery({
    queryKey: ['estudos-caso-lista'],
    queryFn: listarEstudosCaso,
  })

  const hasActiveFilters = !!search.trim() || filtroAluno !== 'all'

  const filtrados = useMemo(() => {
    const termo = search.trim().toLowerCase()
    return estudos
      .filter((ec) => {
        const matchAluno = filtroAluno === 'all' || String(ec.alunoId) === filtroAluno
        if (!matchAluno) return false
        if (!termo) return true
        return (
          ec.titulo.toLowerCase().includes(termo) ||
          ec.alunoNomeCompleto.toLowerCase().includes(termo)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [estudos, search, filtroAluno])

  async function baixarPdf(estudoId: number) {
    try {
      await baixarEstudoCasoPdf(estudoId)
      success('PDF gerado', 'Arquivo baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  async function baixarWord(estudoId: number) {
    try {
      await baixarEstudoCasoWord(estudoId)
      success('Word gerado', 'Arquivo .docx baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  return (
    <>
      <PageHeader
        title="Estudos de caso"
        description="Consulte e baixe os estudos de caso dos seus alunos."
        action={
          <Button onClick={() => navigate('/estudo-caso/nova/aluno')}>
            <Plus size={16} weight="bold" />
            Novo estudo de caso
          </Button>
        }
      />

      <ListPageLayout
        isLoading={isLoading}
        isEmpty={filtrados.length === 0}
        skeletonCount={5}
        filters={
          <ListFilterBar>
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Buscar"
                placeholder="Título ou nome do aluno…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<MagnifyingGlass size={16} />}
              />
            </div>
            <div className="min-w-48 flex-1">
              <label className="text-sm font-semibold mb-1.5 block">Aluno</label>
              <Select value={filtroAluno} onValueChange={setFiltroAluno}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {sortByField(alunos, 'nomeCompleto').map((a) => (
                    <SelectItem key={a.id} value={String(a.id!)}>
                      {a.nomeCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </ListFilterBar>
        }
        empty={
          <FilterEmptyState
            icon={<Article size={32} />}
            hasActiveFilters={hasActiveFilters || estudos.length > 0}
            filteredTitle="Nenhum resultado para os filtros"
            defaultTitle="Nenhum estudo de caso"
            defaultDescription="Crie o primeiro estudo de caso para registrar as observações pedagógicas do aluno."
            defaultAction={
              <Button onClick={() => navigate('/estudo-caso/nova/aluno')}>
                <Plus size={16} weight="bold" />
                Novo estudo de caso
              </Button>
            }
          />
        }
        toolbar={<ListResultToolbar count={filtrados.length} noun="estudo" nounPlural="estudos" />}
      >
        <AnimatedList>
          {filtrados.map((ec, i) => (
            <AnimatedListItem key={ec.id} itemKey={ec.id} index={i}>
              <ResourceListCard
                icon={<Article size={20} weight="duotone" />}
                title={ec.titulo}
                badges={[
                  {
                    label: ec.possuiTextoSimulado ? 'Documento gerado' : 'Sem documento',
                    variant: ec.possuiTextoSimulado ? 'secondary' : 'outline',
                  },
                ]}
                meta={
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={() => navigate(`/alunos/${ec.alunoId}`)}
                    >
                      <User size={12} />
                      {ec.alunoNomeCompleto}
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <CalendarBlank size={12} />
                      {new Date(ec.updatedAt).toLocaleString('pt-BR')}
                    </span>
                  </>
                }
                actions={
                  <>
                    <DownloadFormatMenu
                      ariaLabel={`Baixar estudo ${ec.titulo}`}
                      onPdf={() => baixarPdf(ec.id)}
                      onWord={() => baixarWord(ec.id)}
                    />
                    <Button variant="secondary" size="sm" type="button" onClick={() => setDetalheId(ec.id)}>
                      Ver detalhes
                    </Button>
                  </>
                }
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </ListPageLayout>

      <EstudoCasoDetalheDialog
        open={detalheId != null}
        onOpenChange={(open) => {
          if (!open) setDetalheId(null)
        }}
        estudoId={detalheId}
      />
    </>
  )
}
