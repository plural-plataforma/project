import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Users, Brain, Lightning, CheckSquare, Plus, X, CalendarBlank, MagnifyingGlass } from '@phosphor-icons/react'
import {
  buscarPlanejamentoPorId,
  atualizarPlanejamento,
  excluirPlanejamento,
  vincularAlunoPlano,
  vincularHabilidadePlano,
  vincularEstrategiaPlano,
  vincularAvaliacaoPlano,
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
import { sortByField } from '@/lib/utils'
import dayjs from 'dayjs'
import type { Aluno } from '@/types/aluno'
import type { Habilidade } from '@/types/habilidade'
import type { Estrategia } from '@/types/estrategia'
import type { Avaliacao } from '@/types/avaliacao'

const NIVEL_ENSINO_MAP: Record<number, string> = {
  1: 'Ed. Infantil',
  2: 'Fundamental I',
  3: 'Fundamental II',
  4: 'Ensino Médio',
}

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

      <div className="space-y-4">

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
      </div>

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
