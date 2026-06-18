import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Users, MagnifyingGlass, Trash } from '@phosphor-icons/react'
import { buscarAlunos, excluirAluno } from '@/services/alunoService'
import { buscarEscolasProfessor } from '@/services/professorService'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AnimatedList,
  AnimatedListItem,
  FilterEmptyState,
  ListFilterBar,
  ListPageLayout,
  ListResultToolbar,
  ResourceListCard,
  listDangerIconButtonClass,
} from '@/components/lists'
import { AlunoFormDialog } from './AlunoFormDialog'
import { AlunoExcluirDialog } from './AlunoExcluirDialog'
import { sortByField } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import type { Aluno } from '@/types/aluno'

export default function AlunosPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [escolaFilter, setEscolaFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Aluno | null>(null)

  const { data: alunos = [], isLoading, refetch } = useQuery({
    queryKey: ['alunos'],
    queryFn: buscarAlunos,
  })

  const { data: escolas = [] } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => excluirAluno(id),
    onSuccess: () => {
      success('Aluno excluído', 'O cadastro foi removido.')
      setDeleteTarget(null)
      refetch()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError('Não foi possível excluir', formatFriendlyErrorBody(fb))
    },
  })

  const hasActiveFilters = !!search || escolaFilter !== 'all'

  const filtered = sortByField(
    alunos.filter((a) => {
      const matchSearch = a.nomeCompleto.toLowerCase().includes(search.toLowerCase())
      const matchEscola = escolaFilter === 'all' || String(a.idEscola) === escolaFilter
      return matchSearch && matchEscola
    }),
    'nomeCompleto'
  )

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Gerencie seus alunos e acompanhe seu desenvolvimento"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} weight="bold" />
            Novo aluno
          </Button>
        }
      />

      <ListPageLayout
        isLoading={isLoading}
        isEmpty={filtered.length === 0}
        filters={
          <ListFilterBar>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por nome..."
                leftIcon={<MagnifyingGlass size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {escolas.length > 1 && (
              <div className="min-w-48 flex-1">
                <label className="text-sm font-semibold mb-1.5 block">Escola</label>
                <Select value={escolaFilter} onValueChange={setEscolaFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por escola" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as escolas</SelectItem>
                    {escolas.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nomeInstituicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </ListFilterBar>
        }
        empty={
          <FilterEmptyState
            icon={<Users size={32} />}
            hasActiveFilters={hasActiveFilters}
            filteredTitle="Nenhum aluno encontrado"
            filteredDescription="Tente outros filtros."
            defaultTitle="Nenhum aluno cadastrado"
            defaultDescription="Cadastre o primeiro aluno para começar os atendimentos."
            defaultAction={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={16} weight="bold" />
                Cadastrar aluno
              </Button>
            }
          />
        }
        toolbar={<ListResultToolbar count={filtered.length} noun="aluno" />}
      >
        <AnimatedList>
          {filtered.map((aluno, i) => {
            const initials = aluno.nomeCompleto
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
            const escola = escolas.find((e) => e.id === aluno.idEscola)

            return (
              <AnimatedListItem key={aluno.id ?? i} itemKey={aluno.id ?? i} index={i}>
                <ResourceListCard
                  leading={
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback className="text-sm font-bold">{initials}</AvatarFallback>
                    </Avatar>
                  }
                  title={aluno.nomeCompleto}
                  subtitle={escola?.nomeInstituicao}
                  metaBadges={
                    aluno.nivelEnsino
                      ? [{ label: aluno.nivelEnsino, variant: 'muted' as const }]
                      : []
                  }
                  actions={
                    <>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/alunos/${aluno.id}`)}>
                        Ver perfil
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={listDangerIconButtonClass}
                        aria-label={`Excluir ${aluno.nomeCompleto}`}
                        onClick={() => setDeleteTarget(aluno)}
                      >
                        <Trash size={18} weight="bold" />
                      </Button>
                    </>
                  }
                />
              </AnimatedListItem>
            )
          })}
        </AnimatedList>
      </ListPageLayout>

      <AlunoFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          setDialogOpen(false)
          refetch()
        }}
        escolas={escolas}
      />

      <AlunoExcluirDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        nomeCompleto={deleteTarget?.nomeCompleto ?? ''}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget?.id != null) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </>
  )
}
