import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarBlank, Copy, FilePdf, FileText, DownloadSimple, MagnifyingGlass, Plus, User } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AnimatedList,
  AnimatedListItem,
  FilterEmptyState,
  ListFilterBar,
  ListPageLayout,
  ListResultToolbar,
  ResourceListCard,
} from '@/components/lists'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { downloadRelatorioDocx } from '@/lib/exportRelatorioDocx'
import { downloadRelatorioPdf } from '@/lib/exportRelatorioPdf'
import { sortByField } from '@/lib/utils'
import { buscarAlunos } from '@/services/alunoService'
import { buscarEscolasProfessor } from '@/services/professorService'
import { buscarRelatorioPorId, duplicarRelatorio, listarRelatorios } from '@/services/relatorioService'
import {
  RELATORIO_STATUS_LABELS,
  RELATORIO_TIPO_PERIODO_LABELS,
  type RelatorioStatusCodigo,
  type RelatorioTipoPeriodoCodigo,
} from '@/types/relatorio'

export default function RelatoriosPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [filtroAluno, setFiltroAluno] = useState<string>('all')
  const [filtroEscola, setFiltroEscola] = useState<string>('all')
  const [filtroAno, setFiltroAno] = useState<string>('all')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroTipoPeriodo, setFiltroTipoPeriodo] = useState<string>('all')
  const [filtroStatus, setFiltroStatus] = useState<string>('all')

  const { data: alunos = [] } = useQuery({ queryKey: ['alunos'], queryFn: buscarAlunos })
  const { data: escolas = [] } = useQuery({ queryKey: ['escolas-professor'], queryFn: buscarEscolasProfessor })

  const { data: relatorios = [], isLoading } = useQuery({
    queryKey: ['relatorios-lista', filtroAluno, filtroEscola, filtroTipoPeriodo, filtroStatus, filtroDataInicio, filtroDataFim],
    queryFn: () =>
      listarRelatorios({
        alunoId: filtroAluno === 'all' ? undefined : Number(filtroAluno),
        escolaId: filtroEscola === 'all' ? undefined : Number(filtroEscola),
        tipoPeriodo: filtroTipoPeriodo === 'all' ? undefined : (Number(filtroTipoPeriodo) as RelatorioTipoPeriodoCodigo),
        status: filtroStatus === 'all' ? undefined : (Number(filtroStatus) as RelatorioStatusCodigo),
        dataInicio: filtroDataInicio || undefined,
        dataFim: filtroDataFim || undefined,
      }),
  })

  const anosDisponiveis = useMemo(
    () => Array.from(new Set(alunos.map((a) => a.ano?.trim()).filter((a): a is string => !!a))).sort(),
    [alunos]
  )

  const hasActiveFilters =
    !!search.trim() ||
    filtroAluno !== 'all' ||
    filtroEscola !== 'all' ||
    filtroAno !== 'all' ||
    filtroTipoPeriodo !== 'all' ||
    filtroStatus !== 'all' ||
    !!filtroDataInicio ||
    !!filtroDataFim

  const filtrados = useMemo(() => {
    const termo = search.trim().toLowerCase()
    return relatorios
      .filter((r) => {
        if (filtroAno !== 'all' && r.alunoAno?.trim() !== filtroAno) return false
        if (!termo) return true
        return r.alunoNome.toLowerCase().includes(termo)
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [relatorios, search, filtroAno])

  const duplicarMutation = useMutation({
    mutationFn: (id: number) => duplicarRelatorio(id),
    onSuccess: (novoRelatorio) => {
      success('Relatório duplicado', 'Base criada pro próximo período — gere as seções quando quiser.')
      qc.invalidateQueries({ queryKey: ['relatorios-lista'] })
      navigate(`/relatorios/${novoRelatorio.id}`)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  async function baixarPdf(id: number) {
    try {
      const relatorio = await buscarRelatorioPorId(id)
      downloadRelatorioPdf(relatorio)
      success('PDF gerado', 'Arquivo baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  async function baixarWord(id: number) {
    try {
      const relatorio = await buscarRelatorioPorId(id)
      await downloadRelatorioDocx(relatorio)
      success('Word gerado', 'Arquivo .docx baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  return (
    <>
      <PageHeader
        title="Relatórios Pedagógicos"
        description="Relatórios do AEE por período, gerados a partir do que já foi registrado na plataforma."
        action={
          <Button onClick={() => navigate('/relatorios/novo/aluno')}>
            <Plus size={16} weight="bold" />
            Criar relatório
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
                placeholder="Nome do aluno…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<MagnifyingGlass size={16} />}
              />
            </div>
            <div className="min-w-44 flex-1">
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
            <div className="min-w-44 flex-1">
              <label className="text-sm font-semibold mb-1.5 block">Escola</label>
              <Select value={filtroEscola} onValueChange={setFiltroEscola}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {sortByField(escolas, 'nomeInstituicao').map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nomeInstituicao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-32">
              <label className="text-sm font-semibold mb-1.5 block">Ano/Turma</label>
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {anosDisponiveis.map((ano) => (
                    <SelectItem key={ano} value={ano}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input label="Período de" type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
              <Input label="até" type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
            </div>
            <div className="min-w-36">
              <label className="text-sm font-semibold mb-1.5 block">Tipo de relatório</label>
              <Select value={filtroTipoPeriodo} onValueChange={setFiltroTipoPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">{RELATORIO_TIPO_PERIODO_LABELS[0]}</SelectItem>
                  <SelectItem value="1">{RELATORIO_TIPO_PERIODO_LABELS[1]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-36">
              <label className="text-sm font-semibold mb-1.5 block">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">{RELATORIO_STATUS_LABELS[0]}</SelectItem>
                  <SelectItem value="1">{RELATORIO_STATUS_LABELS[1]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ListFilterBar>
        }
        empty={
          <FilterEmptyState
            icon={<FileText size={32} />}
            hasActiveFilters={hasActiveFilters || relatorios.length > 0}
            filteredTitle="Nenhum resultado para os filtros"
            defaultTitle="Nenhum relatório pedagógico"
            defaultDescription="Crie o primeiro relatório a partir do que já foi registrado para o aluno no período."
            defaultAction={
              <Button onClick={() => navigate('/relatorios/novo/aluno')}>
                <Plus size={16} weight="bold" />
                Criar relatório
              </Button>
            }
          />
        }
        toolbar={<ListResultToolbar count={filtrados.length} noun="relatório" nounPlural="relatórios" />}
      >
        <AnimatedList>
          {filtrados.map((r, i) => (
            <AnimatedListItem key={r.id} itemKey={r.id} index={i}>
              <ResourceListCard
                icon={<FileText size={20} weight="duotone" />}
                title={`${RELATORIO_TIPO_PERIODO_LABELS[r.tipoPeriodo]} · ${r.alunoNome}`}
                badges={[
                  {
                    label: RELATORIO_STATUS_LABELS[r.status],
                    variant: r.status === 1 ? 'success' : 'amber',
                  },
                ]}
                meta={
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      onClick={() => navigate(`/alunos/${r.alunoId}`)}
                    >
                      <User size={12} />
                      {r.alunoNome}
                      {r.alunoAno ? ` · ${r.alunoAno}` : ''}
                    </button>
                    {r.escolaNomeInstituicao && <span>{r.escolaNomeInstituicao}</span>}
                    <span className="inline-flex items-center gap-1">
                      <CalendarBlank size={12} />
                      {new Date(`${r.dataInicio}T12:00:00`).toLocaleDateString('pt-BR')} →{' '}
                      {new Date(`${r.dataFim}T12:00:00`).toLocaleDateString('pt-BR')}
                    </span>
                  </>
                }
                actions={
                  <>
                    {r.status === 1 && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => baixarPdf(r.id)}>
                          <FilePdf size={14} />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => baixarWord(r.id)}>
                          <DownloadSimple size={14} />
                          Word
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      loading={duplicarMutation.isPending && duplicarMutation.variables === r.id}
                      onClick={() => duplicarMutation.mutate(r.id)}
                    >
                      <Copy size={14} />
                      Duplicar
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/relatorios/${r.id}`)}>
                      Visualizar
                    </Button>
                  </>
                }
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </ListPageLayout>
    </>
  )
}
