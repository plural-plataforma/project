import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ClipboardText, CalendarBlank, Users, ChartBar, Warning, UserPlus } from '@phosphor-icons/react'
import { buscarAvaliacoesDiagnosticas, reivindicarAvaliacaoDiagnostica } from '@/services/avaliacaoDiagnosticaService'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import dayjs from 'dayjs'
import type { AvaliacaoDiagnosticaResumo } from '@/types/avaliacao-diagnostica'
import { sortByField } from '@/lib/utils'

export const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'muted' | 'danger' | 'amber' }> = {
  Pendente: { label: 'Pendente', variant: 'muted' },
  EmAndamento: { label: 'Em andamento', variant: 'default' },
  Concluida: { label: 'Concluída', variant: 'success' },
  Cancelada: { label: 'Cancelada', variant: 'danger' },
}

export default function AvaliacoesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ['avaliacoes-diagnosticas'],
    queryFn: buscarAvaliacoesDiagnosticas,
  })

  const { mutate: reivindicar, isPending: isReivindicando } = useMutation({
    mutationFn: reivindicarAvaliacaoDiagnostica,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avaliacoes-diagnosticas'] }),
  })

  const semDono = avaliacoes.filter((av) => av.professorId == null)

  return (
    <>
      <PageHeader
        title="Avaliações Diagnósticas"
        description="Avalie o desempenho dos seus alunos com avaliações estruturadas"
        action={
          <Button onClick={() => navigate('/avaliacoes/nova/identificacao')}>
            <Plus size={16} weight="bold" />
            Nova avaliação
          </Button>
        }
      />

      {semDono.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Warning size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">
              {semDono.length === 1
                ? '1 avaliação sem responsável'
                : `${semDono.length} avaliações sem responsável`}
            </p>
            <p className="text-amber-700">
              As avaliações abaixo ainda não estão vinculadas a nenhuma professora. Clique em{' '}
              <strong>Assumir</strong> para associá-las à sua conta.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonList count={3} />
      ) : avaliacoes.length === 0 ? (
        <EmptyState
          icon={<ClipboardText size={32} />}
          title="Nenhuma avaliação criada"
          description="Crie a primeira avaliação diagnóstica para começar a avaliar seus alunos."
          action={
            <Button onClick={() => navigate('/avaliacoes/nova/identificacao')}>
              <Plus size={16} weight="bold" />
              Nova avaliação
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {sortByField(avaliacoes, 'titulo').map((av, i) => (
              <AvaliacaoCard
                key={av.id}
                avaliacao={av}
                index={i}
                onOpen={(id) => navigate(`/avaliacoes/editar/${id}/identificacao`)}
                onReivindicar={av.professorId == null ? () => reivindicar(av.id) : undefined}
                isReivindicando={isReivindicando}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}

function AvaliacaoCard({
  avaliacao: av,
  index,
  onOpen,
  onReivindicar,
  isReivindicando,
}: {
  avaliacao: AvaliacaoDiagnosticaResumo
  index: number
  onOpen: (id: number) => void
  onReivindicar?: () => void
  isReivindicando?: boolean
}) {
  const status = statusConfig[av.status] ?? { label: av.status, variant: 'muted' as const }
  const navigate = useNavigate()
  const semDono = av.professorId == null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Card className={`p-5 transition-colors duration-200 ${semDono ? 'border-amber-200 bg-amber-50/40 hover:border-amber-400' : 'hover:border-primary'}`}>
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${semDono ? 'bg-amber-100' : 'bg-primary-light'}`}>
            <ClipboardText size={20} className={semDono ? 'text-amber-600' : 'text-primary'} weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-foreground truncate">{av.titulo}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
              {semDono && (
                <Badge variant="amber">Sem responsável</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarBlank size={12} />
                {dayjs(av.dataAplicacao).format('DD/MM/YYYY')}
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} />
                {av.quantidadeAlunos} aluno{av.quantidadeAlunos !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {semDono ? (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-100"
                onClick={onReivindicar}
                disabled={isReivindicando}
              >
                <UserPlus size={14} />
                Assumir
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => onOpen(av.id)}>
                  Abrir
                </Button>
                <Button size="sm" onClick={() => navigate(`/avaliacoes/${av.id}/desempenho`)}>
                  <ChartBar size={14} />
                  Desempenho
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
