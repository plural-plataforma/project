import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBar,
  ClipboardText,
  BookOpen,
  Users,
  TrendUp,
  CheckCircle,
  Clock,
  CalendarBlank,
} from '@phosphor-icons/react'
import { buscarAvaliacoesDiagnosticas, buscarAvaliacaoPorId } from '@/services/avaliacaoDiagnosticaService'
import { buscarPlanejamento } from '@/services/planejamentoService'
import { buscarAlunos } from '@/services/alunoService'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import dayjs from 'dayjs'
import type { Planejamento } from '@/types/planejamento'

type PdiStatus = 'em_andamento' | 'encerrado' | 'futuro'

export function classifyPdi(p: Planejamento): PdiStatus {
  const hoje = dayjs().startOf('day')
  const inicio = dayjs(p.dataInicio).startOf('day')
  const fim = dayjs(p.dataFim).startOf('day')
  if (inicio.isAfter(hoje)) return 'futuro'
  if (fim.isBefore(hoje)) return 'encerrado'
  return 'em_andamento'
}

export function computePercentual(
  registros: Array<{ alunoId: number; nivelRealizacao: string }>,
  alunoId: number
): number {
  const doAluno = registros.filter((r) => r.alunoId === alunoId)
  if (doAluno.length === 0) return 0

  // Regra funcional: NaoAvaliado é exibido na UI, mas não entra no denominador.
  const avaliados = doAluno.filter((r) => r.nivelRealizacao !== 'NaoAvaliado')
  if (avaliados.length === 0) return 0

  const total = avaliados.length
  const autonomos = avaliados.filter((r) => r.nivelRealizacao === 'Autonomia').length
  const comAjuda = avaliados.filter((r) => r.nivelRealizacao === 'ComAjuda').length
  return Math.round((autonomos + comAjuda * 0.5) / total * 100)
}

export default function RelatoriosPage() {
  const [searchParams] = useSearchParams()
  const avaliacaoIdQuery = searchParams.get('avaliacaoId')
  const avaliacaoIdInicial = avaliacaoIdQuery ? Number(avaliacaoIdQuery) : null
  const [avaliacaoId, setAvaliacaoId] = useState<number | null>(null)

  const { data: todasAvaliacoes = [], isLoading: loadingAv } = useQuery({
    queryKey: ['avaliacoes-diagnosticas'],
    queryFn: buscarAvaliacoesDiagnosticas,
  })

  // Exclui avaliações órfãs (sem dono) do relatório — podem conter alunos de outras professoras
  const avaliacoes = todasAvaliacoes.filter((av) => av.professorId != null)

  const { data: avaliacaoDetalhada, isLoading: loadingDetalhe } = useQuery({
    queryKey: ['avaliacao-detalhada', avaliacaoId],
    queryFn: () => buscarAvaliacaoPorId(avaliacaoId!),
    enabled: !!avaliacaoId,
  })

  const { data: planejamentos = [], isLoading: loadingPlan } = useQuery({
    queryKey: ['planejamentos'],
    queryFn: buscarPlanejamento,
  })

  const { data: alunos = [], isLoading: loadingAlunos } = useQuery({
    queryKey: ['alunos'],
    queryFn: buscarAlunos,
  })

  const pdisPorStatus = useMemo(() => {
    const emAndamento = planejamentos.filter((p) => classifyPdi(p) === 'em_andamento')
    const encerrado = planejamentos.filter((p) => classifyPdi(p) === 'encerrado')
    const futuro = planejamentos.filter((p) => classifyPdi(p) === 'futuro')
    return { emAndamento, encerrado, futuro }
  }, [planejamentos])

  const desempenhoPorAluno = useMemo(() => {
    if (!avaliacaoDetalhada) return []
    const registros = (avaliacaoDetalhada.registrosDesempenho ?? []) as Array<{
      alunoId: number
      nivelRealizacao: string
    }>
    const alunosParticipantes = avaliacaoDetalhada.alunosParticipantes ?? avaliacaoDetalhada.alunos ?? []
    const alunoMap = new Map<number, string>()
    for (const ap of alunosParticipantes) {
      const isParticipante = 'alunoId' in ap
      const aluno = isParticipante ? (ap as { aluno?: { id?: number; nomeCompleto?: string; nome?: string } }).aluno ?? ap : ap
      const id = isParticipante ? (ap as { alunoId: number }).alunoId : (ap as { id: number }).id
      const nome = (aluno as { nomeCompleto?: string; nome?: string }).nomeCompleto ?? (aluno as { nome?: string }).nome ?? 'Aluno'
      alunoMap.set(id, nome)
    }

    // Fallback: quando a API trouxer apenas alunoIds, tenta resolver nomes pela lista global.
    if (alunoMap.size === 0 && avaliacaoDetalhada.alunoIds?.length) {
      for (const id of avaliacaoDetalhada.alunoIds) {
        const nome = alunos.find((a) => a.id === id)?.nomeCompleto ?? `Aluno #${id}`
        alunoMap.set(id, nome)
      }
    }

    const ids = registros.length > 0
      ? [...new Set(registros.map((r) => r.alunoId))]
      : [...alunoMap.keys()]

    if (ids.length === 0) return []

    return ids
      .map((id) => ({
        alunoId: id,
        nome: alunoMap.get(id) ?? `Aluno #${id}`,
        percentual: registros.length > 0 ? computePercentual(registros, id) : 0,
      }))
      .sort((a, b) => b.percentual - a.percentual)
  }, [avaliacaoDetalhada, alunos])
  const backendRetornouRegistros =
    !!avaliacaoDetalhada && Array.isArray(avaliacaoDetalhada.registrosDesempenho)

  const isLoading = loadingAv || loadingPlan || loadingAlunos

  useEffect(() => {
    if (!avaliacaoIdInicial || !Number.isFinite(avaliacaoIdInicial) || avaliacoes.length === 0) return
    const existe = avaliacoes.some((av) => av.id === avaliacaoIdInicial)
    if (existe) {
      setAvaliacaoId(avaliacaoIdInicial)
    }
  }, [avaliacaoIdInicial, avaliacoes])

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Visão geral de avaliações, PDIs e desempenho dos alunos"
      />

      {/* Hero stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary to-[#1a4d5c] p-6 md:p-8 mb-8 text-primary-foreground shadow-xl"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <div className="relative flex flex-wrap gap-6">
          <StatCard
            icon={<ClipboardText size={28} weight="duotone" />}
            value={avaliacoes.length}
            label="Avaliações"
            delay={0}
          />
          <StatCard
            icon={<BookOpen size={28} weight="duotone" />}
            value={planejamentos.length}
            label="PDIs"
            delay={0.05}
          />
          <StatCard
            icon={<Users size={28} weight="duotone" />}
            value={alunos.length}
            label="Alunos"
            delay={0.1}
          />
        </div>
      </motion.div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <div className="space-y-8">
          {/* PDIs por status */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendUp size={20} weight="bold" className="text-primary" />
              PDIs por status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PdiStatusCard
                icon={<Clock size={24} weight="duotone" />}
                label="Em andamento"
                count={pdisPorStatus.emAndamento.length}
                variant="primary"
                delay={0}
              />
              <PdiStatusCard
                icon={<CheckCircle size={24} weight="duotone" />}
                label="Encerrados"
                count={pdisPorStatus.encerrado.length}
                variant="success"
                delay={0.05}
              />
              <PdiStatusCard
                icon={<CalendarBlank size={24} weight="duotone" />}
                label="Futuros"
                count={pdisPorStatus.futuro.length}
                variant="amber"
                delay={0.1}
              />
            </div>
          </motion.section>

          {/* Desempenho por avaliação */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ChartBar size={20} weight="bold" className="text-primary" />
              Desempenho por avaliação
            </h2>
            <Card className="p-5 border-border/80">
              {avaliacoes.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Selecione uma avaliação
                  </label>
                  <Select
                    value={avaliacaoId?.toString() ?? ''}
                    onValueChange={(v) => setAvaliacaoId(v ? Number(v) : null)}
                  >
                    <SelectTrigger className="max-w-sm">
                      <SelectValue placeholder="Escolher avaliação..." />
                    </SelectTrigger>
                    <SelectContent>
                      {avaliacoes.map((av) => (
                        <SelectItem key={av.id} value={av.id.toString()}>
                          {av.titulo} — {dayjs(av.dataAplicacao).format('DD/MM/YYYY')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {avaliacoes.length === 0 ? (
                <EmptyState
                  icon={<ClipboardText size={32} />}
                  title="Nenhuma avaliação criada"
                  description="Crie avaliações diagnósticas para visualizar o desempenho dos alunos."
                />
              ) : !avaliacaoId ? (
                <EmptyState
                  icon={<ChartBar size={32} />}
                  title="Nenhuma avaliação selecionada"
                  description="Selecione uma avaliação acima para ver o desempenho dos alunos."
                />
              ) : loadingDetalhe ? (
                <SkeletonList count={3} />
              ) : desempenhoPorAluno.length === 0 ? (
                <EmptyState
                  icon={<ClipboardText size={32} />}
                  title="Sem alunos participantes"
                  description={backendRetornouRegistros
                    ? 'Esta avaliação não possui alunos participantes para exibir desempenho.'
                    : 'A API deste ambiente não retornou o detalhamento de participantes/desempenhos para esta avaliação.'}
                />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {desempenhoPorAluno.map((item, i) => (
                      <DesempenhoBar key={item.alunoId} item={item} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Card>
          </motion.section>
        </div>
      )}
    </>
  )
}

function StatCard({
  icon,
  value,
  label,
  delay,
}: {
  icon: React.ReactNode
  value: number
  label: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-4"
    >
      <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">{icon}</div>
      <div>
        <p className="text-3xl font-black tabular-nums">{value}</p>
        <p className="text-sm text-white/85">{label}</p>
      </div>
    </motion.div>
  )
}

function PdiStatusCard({
  icon,
  label,
  count,
  variant,
  delay,
}: {
  icon: React.ReactNode
  label: string
  count: number
  variant: 'primary' | 'success' | 'amber'
  delay: number
}) {
  const variantStyles = {
    primary: 'bg-primary-light text-primary border-primary/20',
    success: 'bg-success-light text-success border-success/30',
    amber: 'bg-amber-light text-amber-foreground border-amber/30',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className={`p-5 border ${variantStyles[variant]}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/60">{icon}</div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{count}</p>
            <p className="text-sm font-medium opacity-90">{label}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function DesempenhoBar({
  item,
  index,
}: {
  item: { alunoId: number; nome: string; percentual: number }
  index: number
}) {
  const color =
    item.percentual >= 75
      ? 'bg-success'
      : item.percentual >= 50
        ? 'bg-amber'
        : 'bg-danger/80'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="space-y-1.5"
    >
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground truncate pr-2">{item.nome}</span>
        <span className="font-bold tabular-nums shrink-0">{item.percentual}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.percentual}%` }}
          transition={{ duration: 0.5, delay: 0.1 + index * 0.03 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </motion.div>
  )
}
