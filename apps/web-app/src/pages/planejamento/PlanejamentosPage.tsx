import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, MagnifyingGlass, Eye, CalendarBlank, Trash } from '@phosphor-icons/react'
import {
  buscarPlanejamento,
  cadastrarPlanejamento,
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
import { buscarEscolasProfessor } from '@/services/professorService'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { useToast } from '@/hooks/useToast'
import { sortByField } from '@/lib/utils'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { PlanejamentoExcluirDialog } from './PlanejamentoExcluirDialog'
import type { Aluno } from '@/types/aluno'
import type { Planejamento } from '@/types/planejamento'
import type { Habilidade } from '@/types/habilidade'
import type { Estrategia } from '@/types/estrategia'
import type { Avaliacao } from '@/types/avaliacao'

const schema = z.object({
  apelido: z.string().min(3, 'Nome do PAEE obrigatório'),
  dataInicio: z.string().min(1, 'Data de início obrigatória'),
  dataFim: z.string().min(1, 'Data de fim obrigatória'),
  descicaoPlanejamento: z.string().optional(),
}).refine((d) => d.dataFim >= d.dataInicio, {
  message: 'A data de fim deve ser após a data de início',
  path: ['dataFim'],
})

type FormData = z.infer<typeof schema>

type Step = 'info' | 'alunos' | 'habilidades' | 'estrategias' | 'avaliacoes'

const STEPS: { id: Step; label: string }[] = [
  { id: 'info', label: 'Dados' },
  { id: 'alunos', label: 'Alunos' },
  { id: 'habilidades', label: 'Habilidades' },
  { id: 'estrategias', label: 'Estratégias' },
  { id: 'avaliacoes', label: 'Critérios' },
]

const NIVEL_ENSINO_MAP: Record<number, string> = {
  1: 'Ed. Infantil',
  2: 'Fundamental I',
  3: 'Fundamental II',
  4: 'Ensino Médio',
}

export default function PlanejamentosPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pdiParaExcluir, setPdiParaExcluir] = useState<Planejamento | null>(null)
  const [step, setStep] = useState<Step>('info')

  // Seleções
  const [selectedAlunos, setSelectedAlunos] = useState<Aluno[]>([])
  const [selectedHabilidades, setSelectedHabilidades] = useState<Habilidade[]>([])
  const [selectedEstrategias, setSelectedEstrategias] = useState<Estrategia[]>([])
  const [selectedAvaliacoes, setSelectedAvaliacoes] = useState<Avaliacao[]>([])

  // Filtros locais
  const [searchAlunos, setSearchAlunos] = useState('')
  const [searchHabs, setSearchHabs] = useState('')
  const [filterNivel, setFilterNivel] = useState<string>('')
  const [searchEsts, setSearchEsts] = useState('')
  const [searchAvals, setSearchAvals] = useState('')

  const { data: planejamentos = [], isLoading } = useQuery({
    queryKey: ['planejamentos'],
    queryFn: buscarPlanejamento,
  })

  const { data: alunos = [] } = useQuery({ queryKey: ['alunos'], queryFn: buscarAlunos, enabled: dialogOpen })
  const { data: habilidades = [] } = useQuery({ queryKey: ['habilidades'], queryFn: buscarHabilidades, enabled: dialogOpen })
  const { data: estrategias = [] } = useQuery({ queryKey: ['estrategias'], queryFn: buscarEstrategias, enabled: dialogOpen })
  const { data: avaliacoes = [] } = useQuery({ queryKey: ['avaliacoes-criterios'], queryFn: buscarAvaliacoesCriterios, enabled: dialogOpen })
  const { data: escolas = [] } = useQuery({ queryKey: ['escolas-professor'], queryFn: buscarEscolasProfessor, enabled: dialogOpen })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (selectedAlunos.length === 0) throw new Error('Selecione pelo menos um aluno')

      const pdi = await cadastrarPlanejamento({
        apelido: data.apelido,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        descicaoPlanejamento: data.descicaoPlanejamento,
      })

      await Promise.all([
        ...selectedAlunos.map((a) => vincularAlunoPlano(pdi.id, a.id!)),
        ...selectedHabilidades.map((h) => vincularHabilidadePlano(pdi.id, h.id)),
        ...selectedEstrategias.map((e) => vincularEstrategiaPlano(pdi.id, e.id)),
        ...selectedAvaliacoes.map((v) => vincularAvaliacaoPlano(pdi.id, v.id)),
      ])

      return pdi
    },
    onSuccess: (pdi) => {
      qc.invalidateQueries({ queryKey: ['planejamentos'] })
      success('PAEE criado!', 'Planejamento cadastrado e vinculações realizadas.')
      handleClose()
      navigate(`/planejamentos/${pdi.id}`)
    },
    onError: (err: Error) => showError('Erro', err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (planId: number) => excluirPlanejamento(planId),
    onSuccess: () => {
      success('PAEE excluído', 'O planejamento foi removido.')
      setPdiParaExcluir(null)
      void qc.invalidateQueries({ queryKey: ['planejamentos'] })
    },
    onError: (err: Error) => showError('Não foi possível excluir', err.message),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  function handleClose() {
    setDialogOpen(false)
    setStep('info')
    setSelectedAlunos([])
    setSelectedHabilidades([])
    setSelectedEstrategias([])
    setSelectedAvaliacoes([])
    setSearchAlunos('')
    setSearchHabs('')
    setFilterNivel('')
    setSearchEsts('')
    setSearchAvals('')
    reset()
  }

  function toggleItem<T extends { id?: number }>(
    item: T,
    list: T[],
    setList: React.Dispatch<React.SetStateAction<T[]>>
  ) {
    if (!item.id) return
    setList((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    )
  }

  const filtered = sortByField(
    planejamentos.filter((p) => p.apelido.toLowerCase().includes(search.toLowerCase())),
    'apelido'
  )

  function formatDate(d: string) {
    return dayjs(d).format('DD/MM/YYYY')
  }

  function getStatus(p: { dataInicio: string; dataFim: string }) {
    const now = dayjs()
    if (now.isBefore(dayjs(p.dataInicio))) return { label: 'Futuro', variant: 'muted' as const }
    if (now.isAfter(dayjs(p.dataFim))) return { label: 'Encerrado', variant: 'danger' as const }
    return { label: 'Em andamento', variant: 'success' as const }
  }

  const currentStepIdx = STEPS.findIndex((s) => s.id === step)

  // Listas filtradas para cada seção
  const alunosFiltrados = sortByField(
    alunos.filter((a) => a.nomeCompleto.toLowerCase().includes(searchAlunos.toLowerCase())),
    'nomeCompleto'
  )
  const habsFiltradas = sortByField(
    habilidades.filter((h) => {
      const matchNivel = !filterNivel || String(h.idNivelEnsino) === filterNivel
      const matchSearch = !searchHabs || (h.descricao ?? '').toLowerCase().includes(searchHabs.toLowerCase())
      return matchNivel && matchSearch
    }),
    'descricao'
  )
  const estsFiltradas = sortByField(
    estrategias.filter((e) => e.descricao.toLowerCase().includes(searchEsts.toLowerCase())),
    'descricao'
  )
  const avalsFiltradas = sortByField(
    avaliacoes.filter((a) =>
      (a.descricao ?? '').toLowerCase().includes(searchAvals.toLowerCase())
    ),
    'descricao'
  )

  const nomeEscola = (idEscola?: number) =>
    escolas.find((e) => e.id === idEscola)?.nomeInstituicao ?? ''

  return (
    <>
      <LoadingScreen visible={createMutation.isPending} message="Criando PAEE e vinculando..." />

      <PageHeader
        title="PAEE"
        description="Gerencie os planos de desenvolvimento individual"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} weight="bold" />
            Novo PAEE
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome..."
          leftIcon={<MagnifyingGlass size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title={search ? 'Nenhum PAEE encontrado' : 'Nenhum PAEE criado'}
          description={
            search
              ? 'Tente outro termo de busca.'
              : 'Crie o primeiro PAEE para seus alunos.'
          }
          action={
            !search && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={16} weight="bold" />
                Criar PAEE
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((p, i) => {
              const status = getStatus(p)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Card className="p-5 hover:border-primary transition-colors duration-200 group">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        className="flex items-start gap-3 flex-1 min-w-0 text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={() => navigate(`/planejamentos/${p.id}`)}
                        aria-label={`Abrir PAEE ${p.apelido}`}
                      >
                        <div className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                          <BookOpen size={20} className="text-primary" weight="duotone" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground truncate">{p.apelido}</h3>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <CalendarBlank size={12} />
                            <span>{formatDate(p.dataInicio)} → {formatDate(p.dataFim)}</span>
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {!!p.alunos?.length && (
                              <Badge variant="muted">{p.alunos.length} aluno{p.alunos.length !== 1 ? 's' : ''}</Badge>
                            )}
                            {!!p.habilidades?.length && (
                              <Badge variant="muted">{p.habilidades.length} habilidade{p.habilidades.length !== 1 ? 's' : ''}</Badge>
                            )}
                            {!!p.estrategias?.length && (
                              <Badge variant="muted">{p.estrategias.length} estratégia{p.estrategias.length !== 1 ? 's' : ''}</Badge>
                            )}
                          </div>
                        </div>
                        <Eye size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Excluir PAEE ${p.apelido}`}
                        onClick={() => setPdiParaExcluir(p)}
                      >
                        <Trash size={20} weight="bold" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Dialog de Criação em etapas ─── */}
      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Novo PAEE</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex gap-1 border-b border-border pb-3">
            {STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  step === s.id
                    ? 'bg-primary text-white'
                    : idx < currentStepIdx
                    ? 'bg-primary-light text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
                {s.id === 'alunos' && selectedAlunos.length > 0 && (
                  <span className="ml-1 bg-white/30 rounded px-1">{selectedAlunos.length}</span>
                )}
                {s.id === 'habilidades' && selectedHabilidades.length > 0 && (
                  <span className="ml-1 bg-white/30 rounded px-1">{selectedHabilidades.length}</span>
                )}
                {s.id === 'estrategias' && selectedEstrategias.length > 0 && (
                  <span className="ml-1 bg-white/30 rounded px-1">{selectedEstrategias.length}</span>
                )}
                {s.id === 'avaliacoes' && selectedAvaliacoes.length > 0 && (
                  <span className="ml-1 bg-white/30 rounded px-1">{selectedAvaliacoes.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Sem <form>: evita submit implícito (Enter / botão padrão) antes da última etapa */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto py-2 space-y-4">

              {/* ─ Etapa: Dados ─ */}
              {step === 'info' && (
                <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Input
                    label="Nome do PAEE"
                    placeholder="Ex: PAEE 2026 — João Silva"
                    error={errors.apelido?.message}
                    {...register('apelido')}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Data de início"
                      type="date"
                      error={errors.dataInicio?.message}
                      {...register('dataInicio')}
                    />
                    <Input
                      label="Data de fim"
                      type="date"
                      error={errors.dataFim?.message}
                      {...register('dataFim')}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Resumo / Descrição</label>
                    <textarea
                      rows={3}
                      placeholder="Descreva os objetivos gerais deste PAEE..."
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      {...register('descicaoPlanejamento')}
                    />
                  </div>
                </motion.div>
              )}

              {/* ─ Etapa: Alunos (obrigatório) ─ */}
              {step === 'alunos' && (
                <motion.div key="alunos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-danger font-semibold">*</span> Selecione pelo menos um aluno
                  </p>
                  <Input
                    placeholder="Buscar aluno..."
                    value={searchAlunos}
                    onChange={(e) => setSearchAlunos(e.target.value)}
                  />
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {alunosFiltrados.map((a) => {
                      const sel = selectedAlunos.some((s) => s.id === a.id)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleItem(a, selectedAlunos, setSelectedAlunos)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                            sel ? 'border-primary bg-primary-light text-primary font-semibold' : 'border-border hover:bg-muted text-foreground'
                          }`}
                        >
                          <span className="truncate">{a.nomeCompleto}</span>
                          <span className="text-xs text-muted-foreground ml-2 shrink-0">{nomeEscola(a.idEscola)}</span>
                        </button>
                      )
                    })}
                    {alunosFiltrados.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluno encontrado</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─ Etapa: Habilidades ─ */}
              {step === 'habilidades' && (
                <motion.div key="habilidades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar habilidade..."
                      value={searchHabs}
                      onChange={(e) => setSearchHabs(e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={filterNivel}
                      onChange={(e) => setFilterNivel(e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Todos os níveis</option>
                      {Object.entries(NIVEL_ENSINO_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {habsFiltradas.map((h) => {
                      const sel = selectedHabilidades.some((s) => s.id === h.id)
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => toggleItem(h, selectedHabilidades, setSelectedHabilidades)}
                          className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                            sel ? 'border-primary bg-primary-light text-primary font-semibold' : 'border-border hover:bg-muted text-foreground'
                          }`}
                        >
                          <span className="flex-1 leading-snug">{h.descricao}</span>
                          {h.idNivelEnsino && (
                            <Badge variant="muted" className="shrink-0 text-[10px]">
                              {NIVEL_ENSINO_MAP[h.idNivelEnsino] ?? h.idNivelEnsino}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                    {habsFiltradas.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma habilidade encontrada</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─ Etapa: Estratégias ─ */}
              {step === 'estrategias' && (
                <motion.div key="estrategias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <Input
                    placeholder="Buscar estratégia..."
                    value={searchEsts}
                    onChange={(e) => setSearchEsts(e.target.value)}
                  />
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {estsFiltradas.map((e) => {
                      const sel = selectedEstrategias.some((s) => s.id === e.id)
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => toggleItem(e, selectedEstrategias, setSelectedEstrategias)}
                          className={`w-full px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                            sel ? 'border-primary bg-primary-light text-primary font-semibold' : 'border-border hover:bg-muted text-foreground'
                          }`}
                        >
                          {e.descricao}
                        </button>
                      )
                    })}
                    {estsFiltradas.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma estratégia encontrada</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ─ Etapa: Critérios Avaliativos ─ */}
              {step === 'avaliacoes' && (
                <motion.div key="avaliacoes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <Input
                    placeholder="Buscar critério..."
                    value={searchAvals}
                    onChange={(e) => setSearchAvals(e.target.value)}
                  />
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {avalsFiltradas.map((a) => {
                      const sel = selectedAvaliacoes.some((s) => s.id === a.id)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleItem(a, selectedAvaliacoes, setSelectedAvaliacoes)}
                          className={`w-full px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                            sel ? 'border-primary bg-primary-light text-primary font-semibold' : 'border-border hover:bg-muted text-foreground'
                          }`}
                        >
                          {a.descricao}
                        </button>
                      )
                    })}
                    {avalsFiltradas.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum critério encontrado</p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-border mt-2">
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-muted-foreground">
                  {selectedAlunos.length === 0
                    ? <span className="text-danger">Nenhum aluno selecionado*</span>
                    : <span className="text-success">{selectedAlunos.length} aluno{selectedAlunos.length > 1 ? 's' : ''} selecionado{selectedAlunos.length > 1 ? 's' : ''}</span>
                  }
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                  {step !== 'avaliacoes' ? (
                    <Button
                      type="button"
                      onClick={() => {
                        const idx = STEPS.findIndex((s) => s.id === step)
                        setStep(STEPS[idx + 1].id)
                      }}
                    >
                      Próximo
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      loading={createMutation.isPending}
                      onClick={() => void handleSubmit((d) => createMutation.mutate(d))()}
                    >
                      Criar PAEE
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <PlanejamentoExcluirDialog
        open={!!pdiParaExcluir}
        onClose={() => setPdiParaExcluir(null)}
        apelido={pdiParaExcluir?.apelido ?? ''}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pdiParaExcluir?.id != null) deleteMutation.mutate(pdiParaExcluir.id)
        }}
      />
    </>
  )
}
