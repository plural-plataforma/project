import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users,
  Brain,
  Lightning,
  CheckSquare,
  Plus,
  X,
  CalendarBlank,
  MagnifyingGlass,
  DownloadSimple,
  MagicWand,
} from '@phosphor-icons/react'
import {
  buscarPlanejamentoPorId,
  atualizarPlanejamento,
  excluirPlanejamento,
  vincularAlunoPlano,
  vincularHabilidadePlano,
  vincularEstrategiaPlano,
  vincularAvaliacaoPlano,
  substituirEncontrosPlanejamento,
  obterSugestaoDatasEncontros,
} from '@/services/planejamentoService'
import { buscarAlunos } from '@/services/alunoService'
import { buscarHabilidades } from '@/services/habilidadeService'
import { buscarEstrategias } from '@/services/estrategiasService'
import { buscarAvaliacoesCriterios } from '@/services/avaliacaoService'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { PlanejamentoExcluirDialog } from './PlanejamentoExcluirDialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PaeeEncontroEntrada, Planejamento } from '@/types/planejamento'
import dayjs from 'dayjs'
import { sortByField } from '@/lib/utils'
import { downloadPaeePlanejamentoDocx } from '@/lib/exportPaeePlanejamentoDocx'

const NIVEL_ENSINO_MAP: Record<number, string> = {
  1: 'Ed. Infantil',
  2: 'Fundamental I',
  3: 'Fundamental II',
  4: 'Ensino Médio',
}

type LinhaPaeeEnc = PaeeEncontroEntrada & { key: string }

const novaLinhaEncKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `n-${crypto.randomUUID()}`
    : `n-${Date.now()}-${Math.random()}`

export default function PlanejamentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: showError } = useToast()

  // Estado de edição dos dados básicos
  const [editingInfo, setEditingInfo] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formApelido, setFormApelido] = useState('')
  const [formDataInicio, setFormDataInicio] = useState('')
  const [formDataFim, setFormDataFim] = useState('')
  const [formDescricao, setFormDescricao] = useState('')

  // Modais de vinculação
  type VincModal = 'alunos' | 'habilidades' | 'estrategias' | 'avaliacoes' | null
  const [vincModal, setVincModal] = useState<VincModal>(null)
  const [searchVinc, setSearchVinc] = useState('')
  const [filterNivel, setFilterNivel] = useState('')

  const [objCurto, setObjCurto] = useState('')
  const [objMedio, setObjMedio] = useState('')
  const [objLongo, setObjLongo] = useState('')
  const [docDeclaradoAssinado, setDocDeclaradoAssinado] = useState(false)
  const [assinaturaNome, setAssinaturaNome] = useState('')
  const [assinaturaCargo, setAssinaturaCargo] = useState('')
  const [encLinhas, setEncLinhas] = useState<LinhaPaeeEnc[]>([])

  const { data: plan, isLoading } = useQuery({
    queryKey: ['planejamento', id],
    queryFn: () => buscarPlanejamentoPorId(Number(id)),
    enabled: !!id,
  })

  // Dados para os modais (carregados sob demanda)
  const { data: todosAlunos = [] } = useQuery({ queryKey: ['alunos'], queryFn: buscarAlunos, enabled: !!vincModal })
  const { data: todasHabs = [] } = useQuery({ queryKey: ['habilidades'], queryFn: buscarHabilidades, enabled: !!vincModal })
  const { data: todasEsts = [] } = useQuery({ queryKey: ['estrategias'], queryFn: buscarEstrategias, enabled: !!vincModal })
  const { data: todasAvals = [] } = useQuery({ queryKey: ['avaliacoes-criterios'], queryFn: buscarAvaliacoesCriterios, enabled: !!vincModal })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['planejamento', id] })

  const updateMutation = useMutation({
    mutationFn: () => atualizarPlanejamento({
      id: Number(id),
      apelido: formApelido,
      dataInicio: formDataInicio,
      dataFim: formDataFim,
      descicaoPlanejamento: formDescricao,
    }),
    onSuccess: () => { success('PAEE atualizado!'); invalidate(); setEditingInfo(false) },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  function openEdit() {
    if (!plan) return
    setFormApelido(plan.apelido)
    setFormDataInicio(plan.dataInicio)
    setFormDataFim(plan.dataFim)
    setFormDescricao(plan.descicaoPlanejamento ?? '')
    setEditingInfo(true)
  }

  // Vincular mutations
  const vincularMutation = useMutation({
    mutationFn: async ({ type, itemId }: { type: VincModal; itemId: number }) => {
      const planId = Number(id)
      if (type === 'alunos') await vincularAlunoPlano(planId, itemId)
      else if (type === 'habilidades') await vincularHabilidadePlano(planId, itemId)
      else if (type === 'estrategias') await vincularEstrategiaPlano(planId, itemId)
      else if (type === 'avaliacoes') await vincularAvaliacaoPlano(planId, itemId)
    },
    onSuccess: () => { success('Vinculado!'); invalidate() },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => excluirPlanejamento(Number(id)),
    onSuccess: () => {
      success('PAEE excluído', 'O planejamento foi removido.')
      setDeleteDialogOpen(false)
      void qc.invalidateQueries({ queryKey: ['planejamentos'] })
      void qc.invalidateQueries({ queryKey: ['planejamento', id] })
      navigate('/planejamentos')
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError('Não foi possível excluir', formatFriendlyErrorBody(fb))
    },
  })

  /* eslint-disable react-hooks/set-state-in-effect --
     Sincroniza rascunhos com dados da API quando o servidor devolve objeto planejamento atualizado. */
  useEffect(() => {
    if (!plan) return
    setObjCurto(plan.objetivoCurtoPrazo ?? '')
    setObjMedio(plan.objetivoMedioPrazo ?? '')
    setObjLongo(plan.objetivoLongoPrazo ?? '')
    setDocDeclaradoAssinado(plan.documentoDeclaradoAssinado ?? false)
    setAssinaturaNome(plan.assinaturaNomeResponsavel ?? '')
    setAssinaturaCargo(plan.assinaturaCargo ?? '')
    setEncLinhas(
      (plan.encontros ?? []).map((e) => ({
        key: `e-${e.id}`,
        dataEnc: e.dataEnc,
        textoPlanejado: e.textoPlanejado ?? '',
        textoRealizado: e.textoRealizado ?? '',
        habilidadeId: e.habilidadeId ?? null,
        estrategiaId: e.estrategiaId ?? null,
      })),
    )
  }, [plan])
  /* eslint-enable react-hooks/set-state-in-effect */

  const salvarObjetivosMutation = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error('Plano indisponível')
      await atualizarPlanejamento({
        id: Number(id),
        apelido: plan.apelido,
        dataInicio: plan.dataInicio,
        dataFim: plan.dataFim,
        descicaoPlanejamento: plan.descicaoPlanejamento,
        objetivoCurtoPrazo: objCurto,
        objetivoMedioPrazo: objMedio,
        objetivoLongoPrazo: objLongo,
        documentoDeclaradoAssinado: docDeclaradoAssinado,
        assinaturaNomeResponsavel: assinaturaNome,
        assinaturaCargo: assinaturaCargo,
      })
    },
    onSuccess: () => {
      success('Objetivos e assinatura salvos!')
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const salvarEncontrosMutation = useMutation({
    mutationFn: async () => {
      const payload: PaeeEncontroEntrada[] = encLinhas.map((row) => ({
        dataEnc: row.dataEnc,
        textoPlanejado: row.textoPlanejado,
        textoRealizado: row.textoRealizado,
        habilidadeId: row.habilidadeId,
        estrategiaId: row.estrategiaId,
      }))
      await substituirEncontrosPlanejamento(Number(id), payload)
    },
    onSuccess: () => {
      success('Encontros salvos!')
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const sugestaoDatasMutation = useMutation({
    mutationFn: () => obterSugestaoDatasEncontros(Number(id)),
    onSuccess: (datas) => {
      if (datas.length === 0) {
        showError('Sem sugestões', 'Vincule um aluno com dias de atendimento no cadastro ou preencha as datas manualmente.')
        return
      }
      setEncLinhas((prev) => {
        const existentes = new Set(prev.map((p) => p.dataEnc))
        const novas: LinhaPaeeEnc[] = []
        for (const d of datas) {
          if (!existentes.has(d)) {
            existentes.add(d)
            novas.push({
              key: novaLinhaEncKey(),
              dataEnc: d,
              textoPlanejado: '',
              textoRealizado: '',
              habilidadeId: null,
              estrategiaId: null,
            })
          }
        }
        if (novas.length === 0) {
          success('Datas sugeridas já estavam na grade.')
        } else {
          success(`${novas.length} data(s) sugerida(s) adicionada(s).`)
        }
        return [...prev, ...novas].sort((a, b) => a.dataEnc.localeCompare(b.dataEnc))
      })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const planoParaExportacao: Planejamento | null = useMemo(() => {
    if (!plan) return null
    const encOrd = [...encLinhas].sort((a, b) => a.dataEnc.localeCompare(b.dataEnc))
    return {
      ...plan,
      objetivoCurtoPrazo: objCurto,
      objetivoMedioPrazo: objMedio,
      objetivoLongoPrazo: objLongo,
      documentoDeclaradoAssinado: docDeclaradoAssinado,
      assinaturaNomeResponsavel: assinaturaNome,
      assinaturaCargo: assinaturaCargo,
      encontros: encOrd.map((r, ix) => ({
        id: ix + 1,
        dataEnc: r.dataEnc,
        textoPlanejado: r.textoPlanejado || null,
        textoRealizado: r.textoRealizado || null,
        habilidadeId: r.habilidadeId ?? null,
        estrategiaId: r.estrategiaId ?? null,
      })),
    }
  }, [
    plan,
    objCurto,
    objMedio,
    objLongo,
    docDeclaradoAssinado,
    assinaturaNome,
    assinaturaCargo,
    encLinhas,
  ])

  if (isLoading) return <SkeletonList count={4} />
  if (!plan) return <p className="text-muted-foreground">Planejamento não encontrado.</p>

  const formatDate = (d: string) => dayjs(d).format('DD/MM/YYYY')

  const alunosVinculadosIds = new Set((plan.alunos ?? []).map((a) => a.id))
  const habsVinculadasIds = new Set((plan.habilidades ?? []).map((h) => h.id))
  const estsVinculadasIds = new Set((plan.estrategias ?? []).map((e) => e.id))
  const avalsVinculadasIds = new Set((plan.avaliacao ?? []).map((v) => v.id))

  // Listas filtradas no modal
  const alunosDisponiveis = sortByField(
    todosAlunos.filter((a) => !alunosVinculadosIds.has(a.id) && a.nomeCompleto.toLowerCase().includes(searchVinc.toLowerCase())),
    'nomeCompleto'
  )
  const habsDisponiveis = sortByField(
    todasHabs.filter((h) => {
      const notVinc = !habsVinculadasIds.has(h.id)
      const matchNivel = !filterNivel || String(h.idNivelEnsino) === filterNivel
      const matchSearch = !searchVinc || (h.descricao ?? '').toLowerCase().includes(searchVinc.toLowerCase())
      return notVinc && matchNivel && matchSearch
    }),
    'descricao'
  )
  const estsDisponiveis = sortByField(
    todasEsts.filter(
      (e) =>
        !estsVinculadasIds.has(e.id) &&
        (e.descricao ?? '').toLowerCase().includes(searchVinc.toLowerCase())
    ),
    'descricao'
  )
  const avalsDisponiveis = sortByField(
    todasAvals.filter(
      (a) =>
        !avalsVinculadasIds.has(a.id) &&
        (a.descricao ?? '').toLowerCase().includes(searchVinc.toLowerCase())
    ),
    'descricao'
  )

  function openVincModal(type: VincModal) {
    setSearchVinc('')
    setFilterNivel('')
    setVincModal(type)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PageHeader
        title={plan.apelido}
        description="Plano de Desenvolvimento Individual"
        backTo="/planejamentos"
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    if (!planoParaExportacao) return
                    await downloadPaeePlanejamentoDocx({ planejamento: planoParaExportacao })
                    success('Arquivo Word gerado.')
                  } catch (e: unknown) {
                    showError('Não foi possível exportar', e instanceof Error ? e.message : 'Tente novamente.')
                  }
                })()
              }}
            >
              <DownloadSimple size={14} /> Export Word
            </Button>
            <Button variant="outline" size="sm" onClick={openEdit}>
              Editar dados
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Excluir PAEE
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="visao-geral" className="mt-6 w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 p-2">
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos e documentação</TabsTrigger>
          <TabsTrigger value="encontros">Encontros</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6 space-y-4">
        {/* ─ Overview editável ─ */}
        {editingInfo ? (
          <Card>
            <CardContent className="pt-5 space-y-3">
              <Input label="Nome do PAEE" value={formApelido} onChange={(e) => setFormApelido(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Data de início" type="date" value={formDataInicio} onChange={(e) => setFormDataInicio(e.target.value)} />
                <Input label="Data de fim" type="date" value={formDataFim} onChange={(e) => setFormDataFim(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">Descrição</label>
                <textarea
                  rows={3}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditingInfo(false)}>Cancelar</Button>
                <Button size="sm" loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarBlank size={14} />
                  <span>{formatDate(plan.dataInicio)} → {formatDate(plan.dataFim)}</span>
                </div>
                {plan.descicaoPlanejamento && (
                  <p className="text-sm text-foreground leading-relaxed w-full">{plan.descicaoPlanejamento}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">

          {/* ─ Alunos ─ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Alunos ({plan.alunos?.length ?? 0})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => openVincModal('alunos')}>
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!plan.alunos?.length ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {sortByField(plan.alunos, 'nomeCompleto').map((a) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <div className="h-6 w-6 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {a.nomeCompleto[0]}
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{a.nomeCompleto}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─ Habilidades ─ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain size={16} className="text-primary" />
                  Habilidades ({plan.habilidades?.length ?? 0})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => openVincModal('habilidades')}>
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!plan.habilidades?.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma habilidade vinculada.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sortByField(plan.habilidades, 'descricao').map((h) => (
                    <Badge key={h.id} variant="default">
                      {h.resumo || h.descricao || `Habilidade ${h.id}`}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─ Estratégias ─ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightning size={16} className="text-primary" />
                  Estratégias ({plan.estrategias?.length ?? 0})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => openVincModal('estrategias')}>
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!plan.estrategias?.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma estratégia vinculada.</p>
              ) : (
                <div className="space-y-2">
                  {sortByField(plan.estrategias, 'descricao').map((e) => (
                    <div key={e.id} className="text-sm text-foreground p-2 rounded-lg bg-muted">
                      {e.descricao}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─ Critérios Avaliativos ─ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-primary" />
                  Critérios Avaliativos ({plan.avaliacao?.length ?? 0})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => openVincModal('avaliacoes')}>
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!plan.avaliacao?.length ? (
                <p className="text-sm text-muted-foreground">Nenhum critério vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {plan.avaliacao.map((v) => (
                    <div key={v.id} className="text-sm text-foreground p-2 rounded-lg bg-muted">
                      {v.descricao}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="objetivos" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objetivos (curto, médio e longo prazo)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="obj-curto" className="text-sm font-semibold text-foreground">Curto prazo</label>
                <textarea
                  id="obj-curto"
                  rows={3}
                  value={objCurto}
                  onChange={(e) => setObjCurto(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="obj-medio" className="text-sm font-semibold text-foreground">Médio prazo</label>
                <textarea
                  id="obj-medio"
                  rows={3}
                  value={objMedio}
                  onChange={(e) => setObjMedio(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="obj-longo" className="text-sm font-semibold text-foreground">Longo prazo</label>
                <textarea
                  id="obj-longo"
                  rows={3}
                  value={objLongo}
                  onChange={(e) => setObjLongo(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-wrap items-start gap-4 border-t border-border pt-4">
                <div className="flex items-start gap-2 shrink-0 max-w-[20rem]">
                  <Checkbox
                    id="doc-assinado"
                    checked={docDeclaradoAssinado}
                    onCheckedChange={(c) => setDocDeclaradoAssinado(c === true)}
                  />
                  <label htmlFor="doc-assinado" className="text-sm cursor-pointer leading-snug">
                    Documentação conferida pela responsável (metadado, sem integração ICP-Brasil)
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 flex-1 min-w-0">
                  <Input label="Nome para assinatura" value={assinaturaNome} onChange={(e) => setAssinaturaNome(e.target.value)} />
                  <Input label="Cargo ou vínculo" value={assinaturaCargo} onChange={(e) => setAssinaturaCargo(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  loading={salvarObjetivosMutation.isPending}
                  onClick={() => salvarObjetivosMutation.mutate()}
                  type="button"
                >
                  Salvar objetivos e assinatura
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encontros" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Grade de encontros (planejado / realizado)</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => sugestaoDatasMutation.mutate()}
                    loading={sugestaoDatasMutation.isPending}
                  >
                    <MagicWand size={14} /> Sugestão de datas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setEncLinhas((rows) =>
                        [...rows, {
                          key: novaLinhaEncKey(),
                          dataEnc: plan.dataInicio,
                          textoPlanejado: '',
                          textoRealizado: '',
                          habilidadeId: null,
                          estrategiaId: null,
                        }].sort((a, b) => a.dataEnc.localeCompare(b.dataEnc)),
                      )
                    }
                  >
                    <Plus size={14} /> Nova linha
                  </Button>
                  <Button
                    size="sm"
                    loading={salvarEncontrosMutation.isPending}
                    type="button"
                    onClick={() => salvarEncontrosMutation.mutate()}
                  >
                    Salvar encontros
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {!encLinhas.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma linha — use Sugestão de datas ou Nova linha.</p>
              ) : (
                <table className="w-full text-sm border-collapse border border-border min-w-[760px]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left border-r border-border px-2 py-2 font-medium">Data</th>
                      <th className="text-left border-r border-border px-2 py-2 font-medium">Planejado</th>
                      <th className="text-left border-r border-border px-2 py-2 font-medium">Realizado</th>
                      <th className="text-left border-r border-border px-2 py-2 font-medium">Habilidade</th>
                      <th className="text-left border-r border-border px-2 py-2 font-medium">Estratégia</th>
                      <th className="w-[44px]" aria-label="Remover" />
                    </tr>
                  </thead>
                  <tbody>
                    {encLinhas.map((linha, idx, arr) => (
                      <tr key={linha.key} className="border-b border-border odd:bg-muted/10">
                        <td className="border-r align-top p-2">
                          <input
                            type="date"
                            value={linha.dataEnc}
                            max={plan.dataFim}
                            min={plan.dataInicio}
                            aria-label={`Data do encontro ${idx + 1}`}
                            onChange={(ev) =>
                              setEncLinhas(arr.map((r) =>
                                r.key === linha.key ? { ...r, dataEnc: ev.target.value } : r,
                              ))}
                            className="rounded border border-input bg-background px-1 py-1 w-full max-w-[11rem]"
                          />
                        </td>
                        <td className="border-r align-top p-2 w-[22%]">
                          <textarea
                            rows={2}
                            aria-label={`Conteúdo planejado encontro ${idx + 1}`}
                            value={linha.textoPlanejado ?? ''}
                            onChange={(ev) =>
                              setEncLinhas(arr.map((r) =>
                                r.key === linha.key ? { ...r, textoPlanejado: ev.target.value } : r,
                              ))}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs resize-y min-h-[3rem]"
                          />
                        </td>
                        <td className="border-r align-top p-2 w-[22%]">
                          <textarea
                            rows={2}
                            aria-label={`Conteúdo realizado encontro ${idx + 1}`}
                            value={linha.textoRealizado ?? ''}
                            onChange={(ev) =>
                              setEncLinhas(arr.map((r) =>
                                r.key === linha.key ? { ...r, textoRealizado: ev.target.value } : r,
                              ))}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs resize-y min-h-[3rem]"
                          />
                        </td>
                        <td className="border-r align-top p-2 w-[17%]">
                          <select
                            aria-label={`Habilidade encontro ${idx + 1}`}
                            className="w-full rounded border border-input bg-background px-1 py-1 text-xs"
                            value={linha.habilidadeId ?? ''}
                            onChange={(ev) => {
                              const raw = ev.target.value
                              setEncLinhas(arr.map((r) =>
                                r.key === linha.key
                                  ? { ...r, habilidadeId: raw === '' ? null : Number(raw) }
                                  : r,
                              ))
                            }}
                          >
                            <option value="">—</option>
                            {(plan.habilidades ?? []).map((h) => (
                              <option key={h.id} value={h.id}>{h.resumo || h.descricao || h.id}</option>
                            ))}
                          </select>
                        </td>
                        <td className="border-r align-top p-2 w-[17%]">
                          <select
                            aria-label={`Estratégia encontro ${idx + 1}`}
                            className="w-full rounded border border-input bg-background px-1 py-1 text-xs"
                            value={linha.estrategiaId ?? ''}
                            onChange={(ev) => {
                              const raw = ev.target.value
                              setEncLinhas(arr.map((r) =>
                                r.key === linha.key
                                  ? { ...r, estrategiaId: raw === '' ? null : Number(raw) }
                                  : r,
                              ))
                            }}
                          >
                            <option value="">—</option>
                            {(plan.estrategias ?? []).map((est) => (
                              <option key={est.id} value={est.id}>{est.descricao}</option>
                            ))}
                          </select>
                        </td>
                        <td className="align-top p-1 text-center">
                          <button
                            type="button"
                            aria-label={`Remover linha ${idx + 1}`}
                            className="inline-flex rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setEncLinhas(arr.filter((r) => r.key !== linha.key))}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground px-1">
            Sugestão de datas usa o primeiro aluno vinculado (ordenado por nome), dias da semana e frequência cadastrados.
            Todas as datas devem ficar dentro do período do PAEE.
          </p>
        </TabsContent>
      </Tabs>

      {/* ─ Modal de Vinculação ─ */}
      <Dialog open={!!vincModal} onOpenChange={() => setVincModal(null)}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {vincModal === 'alunos' && 'Vincular alunos'}
              {vincModal === 'habilidades' && 'Vincular habilidades'}
              {vincModal === 'estrategias' && 'Vincular estratégias'}
              {vincModal === 'avaliacoes' && 'Vincular critérios avaliativos'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchVinc}
                onChange={(e) => setSearchVinc(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {vincModal === 'habilidades' && (
              <select
                value={filterNivel}
                onChange={(e) => setFilterNivel(e.target.value)}
                className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none"
              >
                <option value="">Todos</option>
                {Object.entries(NIVEL_ENSINO_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {vincModal === 'alunos' && alunosDisponiveis.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => vincularMutation.mutate({ type: 'alunos', itemId: a.id! })}
                disabled={vincularMutation.isPending}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-light text-sm text-foreground text-left transition-colors disabled:opacity-50"
              >
                <span className="truncate">{a.nomeCompleto}</span>
                <Plus size={14} className="text-primary shrink-0 ml-2" />
              </button>
            ))}

            {vincModal === 'habilidades' && habsDisponiveis.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => vincularMutation.mutate({ type: 'habilidades', itemId: h.id })}
                disabled={vincularMutation.isPending}
                className="w-full flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-light text-sm text-foreground text-left transition-colors disabled:opacity-50"
              >
                <span className="flex-1 leading-snug">{h.descricao}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {h.idNivelEnsino && <Badge variant="muted" className="text-[10px]">{NIVEL_ENSINO_MAP[h.idNivelEnsino]}</Badge>}
                  <Plus size={14} className="text-primary" />
                </div>
              </button>
            ))}

            {vincModal === 'estrategias' && estsDisponiveis.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => vincularMutation.mutate({ type: 'estrategias', itemId: e.id })}
                disabled={vincularMutation.isPending}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-light text-sm text-foreground text-left transition-colors disabled:opacity-50"
              >
                <span className="flex-1 leading-snug">{e.descricao}</span>
                <Plus size={14} className="text-primary shrink-0 ml-2" />
              </button>
            ))}

            {vincModal === 'avaliacoes' && avalsDisponiveis.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => vincularMutation.mutate({ type: 'avaliacoes', itemId: a.id })}
                disabled={vincularMutation.isPending}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-light text-sm text-foreground text-left transition-colors disabled:opacity-50"
              >
                <span className="flex-1 leading-snug">{a.descricao}</span>
                <Plus size={14} className="text-primary shrink-0 ml-2" />
              </button>
            ))}

            {((vincModal === 'alunos' && alunosDisponiveis.length === 0) ||
              (vincModal === 'habilidades' && habsDisponiveis.length === 0) ||
              (vincModal === 'estrategias' && estsDisponiveis.length === 0) ||
              (vincModal === 'avaliacoes' && avalsDisponiveis.length === 0)) && (
              <p className="text-sm text-muted-foreground text-center py-6">
                {searchVinc ? 'Nenhum resultado.' : 'Todos já estão vinculados.'}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setVincModal(null)}>
              <X size={14} /> Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PlanejamentoExcluirDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        apelido={plan.apelido}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </motion.div>
  )
}
