import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowClockwise,
  Eye,
  NotePencil,
  Plus,
  PencilSimple,
  Trash,
  DownloadSimple,
  User,
} from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  ListFilterBar,
  ListPageLayout,
  ListResultToolbar,
  ResourceListCard,
  listDangerIconButtonClass,
} from '@/components/lists'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { sortByField } from '@/lib/utils'
import { buscarAlunos } from '@/services/alunoService'
import { buscarPlanejamento } from '@/services/planejamentoService'
import { buscarHabilidades } from '@/services/habilidadeService'
import { buscarEstrategias } from '@/services/estrategiasService'
import {
  listarRelatos,
  cadastrarRelato,
  atualizarRelato,
  excluirRelato,
  relatorioConsolidadoRelatos,
  gerarTextoIARelato,
} from '@/services/relatoAtendimentoService'
import { downloadRelatosConsolidadoDocx } from '@/lib/exportRelatosConsolidadoDocx'
import type { RelatoAtendimento } from '@/types/relatoAtendimento'
import type { Planejamento } from '@/types/planejamento'

const DETALHES_ATENDIMENTO_LABEL =
  'Detalhes do atendimento (avanços e dificuldades e ou justificativa de ausência).'

function montarDetalhesEdicao(r: RelatoAtendimento): string {
  const partes: string[] = []
  if (r.observacoes?.trim()) partes.push(r.observacoes.trim())
  if (r.avancos?.length) partes.push(`Avanços:\n${r.avancos.join('\n')}`)
  if (r.dificuldades?.length) partes.push(`Dificuldades:\n${r.dificuldades.join('\n')}`)
  return partes.join('\n\n')
}

export default function RelatosPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()

  const hoje = dayjs()
  const [dataInicio, setDataInicio] = useState(hoje.startOf('month').format('YYYY-MM-DD'))
  const [dataFim, setDataFim] = useState(hoje.endOf('month').format('YYYY-MM-DD'))
  const [filtroAluno, setFiltroAluno] = useState<string>('all')

  const [dlgOpen, setDlgOpen] = useState(false)
  const [editando, setEditando] = useState<RelatoAtendimento | null>(null)

  const [viewOpen, setViewOpen] = useState(false)
  const [visualizando, setVisualizando] = useState<RelatoAtendimento | null>(null)

  const [formAluno, setFormAluno] = useState<string>('')
  const [formPlano, setFormPlano] = useState<string>('none')
  const [formData, setFormData] = useState(hoje.format('YYYY-MM-DD'))
  const [formPresenca, setFormPresenca] = useState<string>('sim')
  const [formHab, setFormHab] = useState<string>('none')
  const [formEst, setFormEst] = useState<string>('none')
  const [formObs, setFormObs] = useState('')
  const [formTextoIA, setFormTextoIA] = useState('')

  const { data: alunos = [] } = useQuery({ queryKey: ['alunos'], queryFn: buscarAlunos })
  const { data: planejamentos = [] } = useQuery({ queryKey: ['planejamentos'], queryFn: buscarPlanejamento })

  const filtroAlunoNum = filtroAluno === 'all' ? undefined : Number(filtroAluno)

  const { data: relatos = [], isLoading } = useQuery({
    queryKey: ['relatos', filtroAluno, dataInicio, dataFim],
    queryFn: () =>
      listarRelatos({
        alunoId: filtroAlunoNum,
        dataInicio,
        dataFim,
      }),
  })

  const { data: todasHabs = [] } = useQuery({
    queryKey: ['habilidades'],
    queryFn: buscarHabilidades,
    enabled: dlgOpen,
  })
  const { data: todasEsts = [] } = useQuery({
    queryKey: ['estrategias'],
    queryFn: buscarEstrategias,
    enabled: dlgOpen,
  })

  const planosDoAluno = useMemo(() => {
    const aid = Number(formAluno)
    if (!aid) return []
    return planejamentos.filter((p) => (p.alunos ?? []).some((a) => a.id === aid))
  }, [planejamentos, formAluno])

  const planoSelecionado: Planejamento | undefined = useMemo(() => {
    if (formPlano === 'none') return undefined
    const id = Number(formPlano)
    return planejamentos.find((p) => p.id === id)
  }, [formPlano, planejamentos])

  const habsSelect = planoSelecionado?.habilidades?.length
    ? planoSelecionado.habilidades
    : todasHabs
  const estsSelect = planoSelecionado?.estrategias?.length
    ? planoSelecionado.estrategias
    : todasEsts

  function abrirNovo() {
    setEditando(null)
    setFormAluno(filtroAluno !== 'all' ? filtroAluno : '')
    setFormPlano('none')
    setFormData(hoje.format('YYYY-MM-DD'))
    setFormPresenca('sim')
    setFormHab('none')
    setFormEst('none')
    setFormObs('')
    setFormTextoIA('')
    setDlgOpen(true)
  }

  function abrirEditar(r: RelatoAtendimento) {
    setEditando(r)
    setFormAluno(String(r.alunoId))
    setFormPlano(r.planejamentoId != null ? String(r.planejamentoId) : 'none')
    setFormData(r.dataSessao)
    setFormPresenca(r.presencaPresente ? 'sim' : 'nao')
    setFormHab(r.habilidadeId != null ? String(r.habilidadeId) : 'none')
    setFormEst(r.estrategiaId != null ? String(r.estrategiaId) : 'none')
    setFormObs(montarDetalhesEdicao(r))
    setFormTextoIA(r.textoGeradoIA ?? '')
    setDlgOpen(true)
  }

  function abrirVisualizar(r: RelatoAtendimento) {
    setVisualizando(r)
    setViewOpen(true)
  }

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const aid = Number(formAluno)
      if (!aid) throw new Error('Selecione o aluno.')

      const presenca = formPresenca === 'sim'
      const obs = formObs.trim()

      if (!presenca && !obs)
        throw new Error('Informe os detalhes do atendimento quando o aluno não esteve presente.')

      const pid = formPlano === 'none' ? null : Number(formPlano)
      const hid = formHab === 'none' ? null : Number(formHab)
      const eid = formEst === 'none' ? null : Number(formEst)

      const payloadBase = {
        alunoId: aid,
        planejamentoId: pid,
        dataSessao: formData,
        presencaPresente: presenca,
        tipoOcorrencia: 0 as const,
        habilidadeId: hid,
        estrategiaId: eid,
        observacoes: obs.length ? obs : null,
        avancos: [] as string[],
        dificuldades: [] as string[],
      }

      if (editando) {
        return atualizarRelato({
          id: editando.id,
          ...payloadBase,
          textoGeradoIA: formTextoIA.trim() || null,
        })
      }
      return cadastrarRelato(payloadBase)
    },
    onSuccess: () => {
      success(editando ? 'Relato atualizado.' : 'Relato registrado.')
      setDlgOpen(false)
      void qc.invalidateQueries({ queryKey: ['relatos'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const gerarIAMutation = useMutation({
    mutationFn: () => gerarTextoIARelato(editando!.id),
    onSuccess: (atualizado) => {
      success('Texto gerado por IA', 'Revise antes de usar em documentos oficiais.')
      setEditando(atualizado)
      setFormTextoIA(atualizado.textoGeradoIA ?? '')
      void qc.invalidateQueries({ queryKey: ['relatos'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const excluirMutation = useMutation({
    mutationFn: (id: number) => excluirRelato(id),
    onSuccess: () => {
      success('Relato excluído.')
      void qc.invalidateQueries({ queryKey: ['relatos'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  async function exportarConsolidado() {
    try {
      const dados = await relatorioConsolidadoRelatos({
        dataInicio,
        dataFim,
        alunoId: filtroAlunoNum,
      })
      await downloadRelatosConsolidadoDocx({
        dataInicio,
        dataFim,
        itens: dados,
      })
      success('Documento gerado.')
    } catch (e: unknown) {
      const fb = getApiErrorFeedback(e)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  const alunosOrd = sortByField(alunos, 'nomeCompleto')

  return (
    <>
      <PageHeader
        title="Registro de atendimento"
        description="Registro de sessões do AEE, presença e observações pedagógicas."
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" type="button" onClick={() => void exportarConsolidado()}>
              <DownloadSimple size={16} /> Baixar período (.docx)
            </Button>
            <Button size="sm" type="button" onClick={abrirNovo}>
              <Plus size={16} /> Novo registro
            </Button>
          </div>
        }
      />

      <ListPageLayout
        isLoading={isLoading}
        isEmpty={relatos.length === 0}
        skeletonCount={5}
        filters={
          <ListFilterBar>
            <div className="grid grid-cols-2 gap-2 min-w-[200px] flex-1">
              <Input
                label="De"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <Input label="Até" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="min-w-48 flex-1">
              <label className="text-sm font-semibold mb-1.5 block">Aluno</label>
              <Select value={filtroAluno} onValueChange={setFiltroAluno}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {alunosOrd.map((a) => (
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
          <EmptyState
            icon={<NotePencil size={32} />}
            title="Nenhum relato neste período"
            description="Ajuste as datas ou registre uma nova sessão de atendimento."
            action={
              <Button size="sm" type="button" onClick={abrirNovo}>
                <Plus size={16} /> Novo registro
              </Button>
            }
          />
        }
        toolbar={<ListResultToolbar count={relatos.length} noun="registro" nounPlural="registros" />}
      >
        <AnimatedList>
          {relatos.map((r, i) => (
            <AnimatedListItem key={r.id} itemKey={r.id} index={i}>
              <ResourceListCard
                icon={<NotePencil size={20} weight="duotone" />}
                title={new Date(`${r.dataSessao}T12:00:00`).toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                badges={[
                  {
                    label: r.presencaPresente ? 'Presente' : 'Ausente',
                    variant: r.presencaPresente ? 'success' : 'danger',
                  },
                ]}
                subtitle={
                  <span className="inline-flex items-center gap-1">
                    <User size={12} />
                    {r.alunoNome}
                  </span>
                }
                meta={
                  r.planejamentoApelido ? (
                    <span>{r.planejamentoApelido}</span>
                  ) : (
                    <span className="italic">Sem PAEE vinculado</span>
                  )
                }
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={`Visualizar relato ${r.id}`}
                      onClick={() => abrirVisualizar(r)}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button variant="outline" size="sm" type="button" onClick={() => abrirEditar(r)}>
                      <PencilSimple size={14} />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className={listDangerIconButtonClass}
                      aria-label={`Excluir relato ${r.id}`}
                      disabled={excluirMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Excluir este relato permanentemente?')) {
                          excluirMutation.mutate(r.id)
                        }
                      }}
                    >
                      <Trash size={18} weight="bold" />
                    </Button>
                  </>
                }
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </ListPageLayout>

      <Dialog open={dlgOpen} onOpenChange={(o) => !o && setDlgOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <NotePencil size={22} /> {editando ? 'Editar relato' : 'Novo relato'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Aluno</label>
              <Select
                value={formAluno}
                onValueChange={setFormAluno}
                disabled={!!editando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunosOrd.map((a) => (
                    <SelectItem key={a.id} value={String(a.id!)}>
                      {a.nomeCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">PAEE (opcional — exige consonância de hab./estrat.)</label>
              <Select value={formPlano} onValueChange={(v) => { setFormPlano(v); setFormHab('none'); setFormEst('none') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem PAEE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {sortByField(planosDoAluno, 'apelido').map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.apelido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input label="Data do atendimento" type="date" value={formData} onChange={(e) => setFormData(e.target.value)} />

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Presença</label>
              <Select value={formPresenca} onValueChange={setFormPresenca}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Presente</SelectItem>
                  <SelectItem value="nao">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Habilidade (opcional)</label>
              <Select value={formHab} onValueChange={setFormHab}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {sortByField(habsSelect, 'descricao').map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {(h.resumo || h.descricao || `ID ${h.id}`).slice(0, 80)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Estratégia (opcional)</label>
              <Select value={formEst} onValueChange={setFormEst}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {sortByField(estsSelect, 'descricao').map((estr) => (
                    <SelectItem key={estr.id} value={String(estr.id)}>
                      {(estr.descricao || `ID ${estr.id}`).slice(0, 80)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">{DETALHES_ATENDIMENTO_LABEL}</label>
              <textarea
                rows={5}
                value={formObs}
                onChange={(e) => setFormObs(e.target.value)}
                placeholder="Descreva avanços, dificuldades ou justificativa de ausência…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {editando && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-semibold">Relato gerado por IA</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={gerarIAMutation.isPending}
                    onClick={() => gerarIAMutation.mutate()}
                  >
                    <ArrowClockwise size={14} />
                    Gerar com IA
                  </Button>
                </div>
                {editando.textoGeradoIA?.trim() || formTextoIA.trim() ? (
                  <textarea
                    rows={6}
                    value={formTextoIA}
                    onChange={(e) => setFormTextoIA(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/30"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ainda não gerado. Revise antes de usar em documentos oficiais.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setDlgOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" loading={salvarMutation.isPending} onClick={() => salvarMutation.mutate()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={(o) => !o && setViewOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye size={22} /> Relato de {visualizando?.alunoNome}
            </DialogTitle>
          </DialogHeader>

          {visualizando && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-semibold text-foreground">Data</p>
                  <p className="text-muted-foreground">
                    {new Date(`${visualizando.dataSessao}T12:00:00`).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Presença</p>
                  <p className="text-muted-foreground">{visualizando.presencaPresente ? 'Presente' : 'Ausente'}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">PAEE</p>
                  <p className="text-muted-foreground">{visualizando.planejamentoApelido ?? 'Sem PAEE vinculado'}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Habilidade</p>
                  <p className="text-muted-foreground">{visualizando.habilidadeResumo ?? '—'}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Estratégia</p>
                  <p className="text-muted-foreground">{visualizando.estrategiaDescricao ?? '—'}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">{DETALHES_ATENDIMENTO_LABEL}</p>
                <p className="whitespace-pre-line text-muted-foreground">
                  {montarDetalhesEdicao(visualizando) || '—'}
                </p>
              </div>

              <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3">
                <p className="font-semibold text-foreground">Relato gerado por IA</p>
                {visualizando.textoGeradoIA?.trim() ? (
                  <p className="whitespace-pre-line">{visualizando.textoGeradoIA}</p>
                ) : (
                  <p className="text-muted-foreground">Ainda não gerado.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setViewOpen(false)}>
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (visualizando) abrirEditar(visualizando)
                setViewOpen(false)
              }}
            >
              <PencilSimple size={14} />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
