import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus,
  X,
  MagnifyingGlass,
  DownloadSimple,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { PlanejamentoExcluirDialog } from './PlanejamentoExcluirDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PaeeEncontroEntrada, Planejamento } from '@/types/planejamento'
import { sortByField } from '@/lib/utils'
import { downloadPaeePlanejamentoDocx } from '@/lib/exportPaeePlanejamentoDocx'
import { baixarPlanejamentoPdf } from '@/lib/baixarPlanejamento'
import { PlanejamentoObjetivosTab } from './PlanejamentoObjetivosTab'
import { PlanejamentoRevisaoTab } from './PlanejamentoRevisaoTab'
import { PlanejamentoVisaoGeralTab } from './PlanejamentoVisaoGeralTab'
import { PlanejamentoEncontrosTab, type LinhaPaeeEnc } from './PlanejamentoEncontrosTab'

const NIVEL_ENSINO_MAP: Record<number, string> = {
  1: 'Ed. Infantil',
  2: 'Fundamental I',
  3: 'Fundamental II',
  4: 'Ensino Médio',
}

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
  const [objCurtoCatalogoId, setObjCurtoCatalogoId] = useState<number | null>(null)
  const [objMedioCatalogoId, setObjMedioCatalogoId] = useState<number | null>(null)
  const [objLongoCatalogoId, setObjLongoCatalogoId] = useState<number | null>(null)
  const [encLinhas, setEncLinhas] = useState<LinhaPaeeEnc[]>([])
  const datasAutoCarregadasRef = useRef<number | null>(null)

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
    if (!plan || !id) return
    setObjCurto(plan.objetivoCurtoPrazo ?? '')
    setObjMedio(plan.objetivoMedioPrazo ?? '')
    setObjLongo(plan.objetivoLongoPrazo ?? '')
    setObjCurtoCatalogoId(plan.objetivoCurtoCatalogoId ?? null)
    setObjMedioCatalogoId(plan.objetivoMedioCatalogoId ?? null)
    setObjLongoCatalogoId(plan.objetivoLongoCatalogoId ?? null)

    const salvos = plan.encontros ?? []
    if (salvos.length > 0) {
      setEncLinhas(
        salvos.map((e) => ({
          key: `e-${e.id}`,
          dataEnc: e.dataEnc,
          textoPlanejado: e.textoPlanejado ?? '',
          habilidadeId: e.habilidadeId ?? null,
          estrategiaId: e.estrategiaId ?? null,
        })),
      )
      return
    }

    const planId = Number(id)
    if (datasAutoCarregadasRef.current === planId) return
    datasAutoCarregadasRef.current = planId

    void obterSugestaoDatasEncontros(planId)
      .then((datas) => {
        if (datas.length === 0) {
          setEncLinhas([])
          return
        }
        setEncLinhas(
          datas.map((d) => ({
            key: novaLinhaEncKey(),
            dataEnc: d,
            textoPlanejado: '',
            habilidadeId: null,
            estrategiaId: null,
          })),
        )
      })
      .catch(() => setEncLinhas([]))
  }, [plan, id])
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
        objetivoCurtoCatalogoId: objCurtoCatalogoId,
        objetivoMedioCatalogoId: objMedioCatalogoId,
        objetivoLongoCatalogoId: objLongoCatalogoId,
      })
    },
    onSuccess: () => {
      success('Objetivos salvos!')
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
        habilidadeId: row.habilidadeId,
        estrategiaId: row.estrategiaId,
      }))
      await substituirEncontrosPlanejamento(Number(id), payload)
    },
    onSuccess: () => {
      success('Encontros salvos!')
      void qc.invalidateQueries({ queryKey: ['planejamentos'] })
      navigate('/planejamentos')
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
      objetivoCurtoCatalogoId: objCurtoCatalogoId,
      objetivoMedioCatalogoId: objMedioCatalogoId,
      objetivoLongoCatalogoId: objLongoCatalogoId,
      encontros: encOrd.map((r, ix) => ({
        id: ix + 1,
        dataEnc: r.dataEnc,
        textoPlanejado: r.textoPlanejado || null,
        habilidadeId: r.habilidadeId ?? null,
        estrategiaId: r.estrategiaId ?? null,
      })),
    }
  }, [plan, objCurto, objMedio, objLongo, objCurtoCatalogoId, objMedioCatalogoId, objLongoCatalogoId, encLinhas])

  if (isLoading) return <SkeletonList count={4} />
  if (!plan) return <p className="text-muted-foreground">Planejamento não encontrado.</p>

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
                    await baixarPlanejamentoPdf(Number(id))
                    success('PDF gerado.')
                  } catch (e: unknown) {
                    showError('Não foi possível exportar', e instanceof Error ? e.message : 'Tente novamente.')
                  }
                })()
              }}
            >
              <DownloadSimple size={14} /> Baixar PDF
            </Button>
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
              <DownloadSimple size={14} /> Baixar Word
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
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
          <TabsTrigger value="encontros">Encontros</TabsTrigger>
          <TabsTrigger value="revisao">Revisão</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6">
          <PlanejamentoVisaoGeralTab
            plan={plan}
            editingInfo={editingInfo}
            formApelido={formApelido}
            setFormApelido={setFormApelido}
            formDataInicio={formDataInicio}
            setFormDataInicio={setFormDataInicio}
            formDataFim={formDataFim}
            setFormDataFim={setFormDataFim}
            formDescricao={formDescricao}
            setFormDescricao={setFormDescricao}
            saving={updateMutation.isPending}
            onSave={() => updateMutation.mutate()}
            onCancelEdit={() => setEditingInfo(false)}
            onOpenVincModal={openVincModal}
          />
        </TabsContent>

        <TabsContent value="objetivos" className="mt-6 space-y-4">
          <PlanejamentoObjetivosTab
            objCurto={objCurto}
            objMedio={objMedio}
            objLongo={objLongo}
            objCurtoCatalogoId={objCurtoCatalogoId}
            objMedioCatalogoId={objMedioCatalogoId}
            objLongoCatalogoId={objLongoCatalogoId}
            onObjCurtoChange={setObjCurto}
            onObjMedioChange={setObjMedio}
            onObjLongoChange={setObjLongo}
            onObjCurtoCatalogoIdChange={setObjCurtoCatalogoId}
            onObjMedioCatalogoIdChange={setObjMedioCatalogoId}
            onObjLongoCatalogoIdChange={setObjLongoCatalogoId}
            onSave={() => salvarObjetivosMutation.mutate()}
            saving={salvarObjetivosMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="encontros" className="mt-6">
          <PlanejamentoEncontrosTab
            plan={plan}
            encLinhas={encLinhas}
            setEncLinhas={setEncLinhas}
            saving={salvarEncontrosMutation.isPending}
            onSave={() => salvarEncontrosMutation.mutate()}
            sugerindoDatas={sugestaoDatasMutation.isPending}
            onSugerirDatas={() => sugestaoDatasMutation.mutate()}
            onNovaLinhaKey={novaLinhaEncKey}
          />
        </TabsContent>

        <TabsContent value="revisao" className="mt-6 space-y-4">
          {planoParaExportacao && (
            <PlanejamentoRevisaoTab
              plano={planoParaExportacao}
              onExportWord={() => {
                void (async () => {
                  try {
                    await downloadPaeePlanejamentoDocx({ planejamento: planoParaExportacao })
                    success('Arquivo Word gerado.')
                  } catch (e: unknown) {
                    showError('Não foi possível exportar', e instanceof Error ? e.message : 'Tente novamente.')
                  }
                })()
              }}
            />
          )}
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
