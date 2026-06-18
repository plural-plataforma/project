import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ClipboardText, CalendarBlank, Users, Warning, UserPlus } from '@phosphor-icons/react'
import { buscarAvaliacoesDiagnosticas, reivindicarAvaliacaoDiagnostica } from '@/services/avaliacaoDiagnosticaService'
import { baixarAvaliacaoDiagnosticaPdf, baixarAvaliacaoDiagnosticaWord } from '@/lib/baixarAvaliacaoDiagnostica'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import {
  AnimatedList,
  AnimatedListItem,
  DownloadFormatMenu,
  ListNoticeBanner,
  ListPageLayout,
  ListResultToolbar,
  ResourceListCard,
} from '@/components/lists'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
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
        description="Monte e aplique avaliações diagnósticas estruturadas por áreas e atividades"
        action={
          <Button onClick={() => navigate('/avaliacoes/nova/identificacao')}>
            <Plus size={16} weight="bold" />
            Nova avaliação
          </Button>
        }
      />

      <ListPageLayout
        isLoading={isLoading}
        isEmpty={avaliacoes.length === 0}
        banner={
          semDono.length > 0 ? (
            <ListNoticeBanner
              icon={<Warning size={18} weight="fill" className="text-amber-500" />}
              title={
                semDono.length === 1
                  ? '1 avaliação sem responsável'
                  : `${semDono.length} avaliações sem responsável`
              }
            >
              <p className="text-amber-700 dark:text-amber-300/90">
                As avaliações abaixo ainda não estão vinculadas a nenhuma professora. Clique em{' '}
                <strong>Assumir</strong> para associá-las à sua conta.
              </p>
            </ListNoticeBanner>
          ) : undefined
        }
        empty={
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
        }
        toolbar={<ListResultToolbar count={avaliacoes.length} noun="avaliação" nounPlural="avaliações" />}
      >
        <AnimatedList>
          {sortByField(avaliacoes, 'titulo').map((av, i) => (
            <AnimatedListItem key={av.id} itemKey={av.id} index={i}>
              <AvaliacaoCard
                avaliacao={av}
                onOpen={(id) => navigate(`/avaliacoes/editar/${id}/identificacao`)}
                onReivindicar={av.professorId == null ? () => reivindicar(av.id) : undefined}
                isReivindicando={isReivindicando}
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </ListPageLayout>
    </>
  )
}

function AvaliacaoCard({
  avaliacao: av,
  onOpen,
  onReivindicar,
  isReivindicando,
}: {
  avaliacao: AvaliacaoDiagnosticaResumo
  onOpen: (id: number) => void
  onReivindicar?: () => void
  isReivindicando?: boolean
}) {
  const status = statusConfig[av.status] ?? { label: av.status, variant: 'muted' as const }
  const { success, error: showError } = useToast()
  const semDono = av.professorId == null

  const badges = [
    { label: status.label, variant: status.variant },
    ...(semDono ? [{ label: 'Sem responsável', variant: 'amber' as const }] : []),
  ]

  return (
    <ResourceListCard
      highlight={semDono ? 'amber' : 'default'}
      icon={<ClipboardText size={20} weight="duotone" />}
      title={av.titulo}
      badges={badges}
      meta={
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
      }
      actions={
        semDono ? (
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
            <DownloadFormatMenu
              ariaLabel={`Baixar avaliação ${av.titulo}`}
              onPdf={async () => {
                try {
                  await baixarAvaliacaoDiagnosticaPdf(av.id)
                  success('PDF gerado', 'Arquivo baixado com sucesso.')
                } catch (err: unknown) {
                  const fb = getApiErrorFeedback(err)
                  showError(fb.title, formatFriendlyErrorBody(fb))
                }
              }}
              onWord={async () => {
                try {
                  await baixarAvaliacaoDiagnosticaWord(av.id)
                  success('Word gerado', 'Arquivo .docx baixado com sucesso.')
                } catch (err: unknown) {
                  const fb = getApiErrorFeedback(err)
                  showError(fb.title, formatFriendlyErrorBody(fb))
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={() => onOpen(av.id)}>
              Editar
            </Button>
          </>
        )
      }
    />
  )
}
