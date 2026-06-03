import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  NotePencil,
  Plus,
  PencilSimple,
  Trash,
  DownloadSimple,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
} from '@/services/relatoAtendimentoService'
import { downloadRelatosConsolidadoDocx } from '@/lib/exportRelatosConsolidadoDocx'
import type { RelatoAtendimento, RelatoTipoOcorrencia } from '@/types/relatoAtendimento'
import type { Planejamento } from '@/types/planejamento'

const TIPO_OPTIONS: { value: RelatoTipoOcorrencia; label: string }[] = [
  { value: 0, label: 'Sessão normal' },
  { value: 1, label: 'Cancelada' },
  { value: 2, label: 'Reagendada' },
]

function splitLinhas(texto: string): string[] {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
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

  const [formAluno, setFormAluno] = useState<string>('')
  const [formPlano, setFormPlano] = useState<string>('none')
  const [formData, setFormData] = useState(hoje.format('YYYY-MM-DD'))
  const [formPresenca, setFormPresenca] = useState<string>('sim')
  const [formTipo, setFormTipo] = useState<string>('0')
  const [formHab, setFormHab] = useState<string>('none')
  const [formEst, setFormEst] = useState<string>('none')
  const [formObs, setFormObs] = useState('')
  const [formAvancos, setFormAvancos] = useState('')
  const [formDific, setFormDific] = useState('')

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
    setFormTipo('0')
    setFormHab('none')
    setFormEst('none')
    setFormObs('')
    setFormAvancos('')
    setFormDific('')
    setDlgOpen(true)
  }

  function abrirEditar(r: RelatoAtendimento) {
    setEditando(r)
    setFormAluno(String(r.alunoId))
    setFormPlano(r.planejamentoId != null ? String(r.planejamentoId) : 'none')
    setFormData(r.dataSessao)
    setFormPresenca(r.presencaPresente ? 'sim' : 'nao')
    setFormTipo(String(r.tipoOcorrencia))
    setFormHab(r.habilidadeId != null ? String(r.habilidadeId) : 'none')
    setFormEst(r.estrategiaId != null ? String(r.estrategiaId) : 'none')
    setFormObs(r.observacoes ?? '')
    setFormAvancos((r.avancos ?? []).join('\n'))
    setFormDific((r.dificuldades ?? []).join('\n'))
    setDlgOpen(true)
  }

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const aid = Number(formAluno)
      if (!aid) throw new Error('Selecione o aluno.')

      const presenca = formPresenca === 'sim'
      const tipo = Number(formTipo) as RelatoTipoOcorrencia
      const obs = formObs.trim()

      if (!presenca && !obs)
        throw new Error('Informe observações quando o aluno não esteve presente.')
      if (tipo !== 0 && !obs)
        throw new Error('Informe observações quando a ocorrência não for sessão normal.')

      const pid = formPlano === 'none' ? null : Number(formPlano)
      const hid = formHab === 'none' ? null : Number(formHab)
      const eid = formEst === 'none' ? null : Number(formEst)

      const payloadBase = {
        alunoId: aid,
        planejamentoId: pid,
        dataSessao: formData,
        presencaPresente: presenca,
        tipoOcorrencia: tipo,
        habilidadeId: hid,
        estrategiaId: eid,
        observacoes: obs.length ? obs : null,
        avancos: splitLinhas(formAvancos),
        dificuldades: splitLinhas(formDific),
      }

      if (editando) {
        return atualizarRelato({ id: editando.id, ...payloadBase })
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
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

      <Card className="mt-6">
        <CardContent className="pt-5 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
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
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        {isLoading ? (
          <SkeletonList count={5} />
        ) : relatos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum relato neste período. Ajuste as datas ou registre uma nova sessão.
          </p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Aluno</th>
                    <th className="px-3 py-2 font-semibold">Presença</th>
                    <th className="px-3 py-2 font-semibold">Tipo</th>
                    <th className="px-3 py-2 font-semibold">PAEE</th>
                    <th className="px-3 py-2 font-semibold w-[120px]" />
                  </tr>
                </thead>
                <tbody>
                  {relatos.map((r) => (
                    <tr key={r.id} className="border-b border-border odd:bg-muted/20">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(`${r.dataSessao}T12:00:00`).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-2">{r.alunoNome}</td>
                      <td className="px-3 py-2">{r.presencaPresente ? 'Presente' : 'Ausente'}</td>
                      <td className="px-3 py-2">
                        {TIPO_OPTIONS.find((t) => t.value === r.tipoOcorrencia)?.label ?? r.tipoOcorrencia}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]" title={r.planejamentoApelido ?? ''}>
                        {r.planejamentoApelido ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" type="button" aria-label={`Editar relato ${r.id}`} onClick={() => abrirEditar(r)}>
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="text-destructive hover:text-destructive"
                            aria-label={`Excluir relato ${r.id}`}
                            disabled={excluirMutation.isPending}
                            onClick={() => {
                              if (window.confirm('Excluir este relato permanentemente?')) {
                                excluirMutation.mutate(r.id)
                              }
                            }}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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

            <Input label="Data da sessão" type="date" value={formData} onChange={(e) => setFormData(e.target.value)} />

            <div className="grid grid-cols-2 gap-2">
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
                <label className="text-sm font-semibold mb-1.5 block">Tipo de ocorrência</label>
                <Select value={formTipo} onValueChange={setFormTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <label className="text-sm font-semibold mb-1.5 block">Observações</label>
              <textarea
                rows={3}
                value={formObs}
                onChange={(e) => setFormObs(e.target.value)}
                placeholder="Detalhes da sessão, justificativa de ausência ou reagendamento…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 flex items-center gap-1">
                <MagnifyingGlass size={14} /> Avanços (um por linha)
              </label>
              <textarea
                rows={2}
                value={formAvancos}
                onChange={(e) => setFormAvancos(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-y min-h-12"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Dificuldades (uma por linha)</label>
              <textarea
                rows={2}
                value={formDific}
                onChange={(e) => setFormDific(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-y min-h-12"
              />
            </div>
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
    </motion.div>
  )
}
