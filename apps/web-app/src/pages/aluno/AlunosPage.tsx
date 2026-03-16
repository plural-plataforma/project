import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, MagnifyingGlass, Eye, GraduationCap } from '@phosphor-icons/react'
import { buscarAlunos } from '@/services/alunoService'
import { buscarEscolasProfessor } from '@/services/professorService'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlunoFormDialog } from './AlunoFormDialog'
import { sortByField } from '@/lib/utils'

export default function AlunosPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [escolaFilter, setEscolaFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: alunos = [], isLoading, refetch } = useQuery({
    queryKey: ['alunos'],
    queryFn: buscarAlunos,
  })

  const { data: escolas = [] } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })

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

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por nome..."
            leftIcon={<MagnifyingGlass size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {escolas.length > 1 && (
          <Select value={escolaFilter} onValueChange={setEscolaFilter}>
            <SelectTrigger className="w-48">
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
        )}
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title={search || escolaFilter !== 'all' ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          description={
            search || escolaFilter !== 'all'
              ? 'Tente outros filtros.'
              : 'Cadastre o primeiro aluno para começar os atendimentos.'
          }
          action={
            !search && escolaFilter === 'all' && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={16} weight="bold" />
                Cadastrar aluno
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{filtered.length} aluno{filtered.length !== 1 ? 's' : ''}</p>
          <AnimatePresence initial={false}>
            {filtered.map((aluno, i) => {
              const initials = aluno.nomeCompleto
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()

              const escola = escolas.find((e) => e.id === aluno.idEscola)

              return (
                <motion.div
                  key={aluno.id ?? i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <Card className="p-4 hover:border-primary transition-colors duration-200 group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{aluno.nomeCompleto}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            {escola && (
                              <span className="text-xs text-muted-foreground truncate">
                                {escola.nomeInstituicao}
                              </span>
                            )}
                            {aluno.nivelEnsino && (
                              <Badge variant="muted" className="text-xs">
                                <GraduationCap size={10} className="mr-1" />
                                {aluno.nivelEnsino}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/alunos/${aluno.id}`)}
                        aria-label="Ver perfil do aluno"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <AlunoFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { setDialogOpen(false); refetch() }}
        escolas={escolas}
      />
    </>
  )
}
