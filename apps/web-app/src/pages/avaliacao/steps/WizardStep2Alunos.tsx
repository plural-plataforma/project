import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buscarAlunos } from '@/services/alunoService'
import { useAvaliacaoWizardStore } from '@/stores/avaliacaoWizardStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlass, ArrowLeft, ArrowRight, CheckSquare, Square } from '@phosphor-icons/react'
import { cn, sortByField } from '@/lib/utils'

export function WizardStep2Alunos() {
  const navigate = useNavigate()
  const { data: wizardData, updateData, markStepComplete, isEditing, avaliacaoId } = useAvaliacaoWizardStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>(wizardData.alunoIds ?? [])
  const [error, setError] = useState('')

  useEffect(() => {
    setSelected(wizardData.alunoIds ?? [])
  }, [wizardData.alunoIds])

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ['alunos'],
    queryFn: buscarAlunos,
  })

  const filtered = sortByField(
    alunos.filter((a) => a.nomeCompleto.toLowerCase().includes(search.toLowerCase())),
    'nomeCompleto'
  )

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setError('')
  }

  function toggleAll() {
    if (selected.length === filtered.length) {
      setSelected([])
    } else {
      setSelected(filtered.map((a) => a.id!).filter(Boolean))
    }
  }

  function handleNext() {
    if (selected.length === 0) {
      setError('Selecione ao menos um aluno para continuar.')
      return
    }
    updateData({ alunoIds: selected })
    markStepComplete('alunos')
    navigate(isEditing && avaliacaoId ? `/avaliacoes/editar/${avaliacaoId}/areas` : '/avaliacoes/nova/areas')
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Selecionar Alunos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha quais alunos participarão desta avaliação.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar aluno..."
              leftIcon={<MagnifyingGlass size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selected.length > 0 && (
            <Badge variant="default">{selected.length} selecionado{selected.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>

        {filtered.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline cursor-pointer"
          >
            {selected.length === filtered.length ? (
              <CheckSquare size={16} weight="fill" />
            ) : (
              <Square size={16} />
            )}
            {selected.length === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((aluno) => {
              const isSelected = selected.includes(aluno.id!)
              const initials = aluno.nomeCompleto
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()

              return (
                <button
                  key={aluno.id}
                  type="button"
                  onClick={() => toggle(aluno.id!)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer text-left',
                    isSelected
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-semibold text-foreground truncate">
                    {aluno.nomeCompleto}
                  </span>
                  {isSelected && (
                    <CheckSquare size={18} className="text-primary shrink-0" weight="fill" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {error && <p className="text-xs text-danger font-medium">{error}</p>}

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(isEditing && avaliacaoId ? `/avaliacoes/editar/${avaliacaoId}/identificacao` : '/avaliacoes/nova/identificacao')
            }
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
          <Button onClick={handleNext}>
            Próximo
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
