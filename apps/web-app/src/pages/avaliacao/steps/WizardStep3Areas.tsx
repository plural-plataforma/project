import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { buscarBlocosComAtividades } from '@/services/blocosService'
import { useAvaliacaoWizardStore } from '@/stores/avaliacaoWizardStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CaretDown, CaretUp, CheckSquare, Square } from '@phosphor-icons/react'
import { cn, sortByField } from '@/lib/utils'

export function WizardStep3Areas() {
  const navigate = useNavigate()
  const { data: wizardData, updateData, markStepComplete, isEditing, avaliacaoId } = useAvaliacaoWizardStore()
  const [expandedBlocos, setExpandedBlocos] = useState<Record<number, boolean>>({})
  const [error, setError] = useState('')

  const { data: blocos = [], isLoading } = useQuery({
    queryKey: ['blocos-com-atividades'],
    queryFn: buscarBlocosComAtividades,
  })

  const [selectedByBloco, setSelectedByBloco] = useState<Record<number, number[]>>(() => {
    if (wizardData.blocos?.length) {
      return Object.fromEntries(wizardData.blocos.map((b) => [b.blocoId, b.atividadeIds]))
    }
    if (wizardData.blocoIds?.length) {
      return Object.fromEntries(wizardData.blocoIds.map((blocoId) => [blocoId, []]))
    }
    return {}
  })

  useEffect(() => {
    if (wizardData.blocos?.length) {
      setSelectedByBloco(Object.fromEntries(wizardData.blocos.map((b) => [b.blocoId, b.atividadeIds])))
      return
    }
    if (wizardData.blocoIds?.length) {
      setSelectedByBloco(Object.fromEntries(wizardData.blocoIds.map((blocoId) => [blocoId, []])))
      return
    }
    setSelectedByBloco({})
  }, [wizardData.blocoIds, wizardData.blocos])

  const selectedCount = useMemo(
    () => Object.values(selectedByBloco).reduce((acc, atividades) => acc + atividades.length, 0),
    [selectedByBloco]
  )

  function toggleExpand(id: number) {
    setExpandedBlocos((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleAtividade(blocoId: number, atividadeId: number) {
    setSelectedByBloco((prev) => {
      const selectedAtual = prev[blocoId] ?? []
      const jaSelecionado = selectedAtual.includes(atividadeId)
      const proximo = jaSelecionado
        ? selectedAtual.filter((id) => id !== atividadeId)
        : [...selectedAtual, atividadeId]

      const nextState = { ...prev }
      if (proximo.length === 0) {
        delete nextState[blocoId]
      } else {
        nextState[blocoId] = proximo
      }
      return nextState
    })
    setError('')
  }

  function handleNext() {
    const blocosSelecionados = Object.entries(selectedByBloco).map(([blocoId, atividadeIds]) => ({
      blocoId: Number(blocoId),
      atividadeIds,
    }))

    if (blocosSelecionados.length === 0 || selectedCount === 0) {
      setError('Selecione ao menos uma atividade para continuar.')
      return
    }

    updateData({
      blocoIds: blocosSelecionados.map((b) => b.blocoId),
      blocos: blocosSelecionados,
    })
    markStepComplete('areas')
    navigate(isEditing && avaliacaoId ? `/avaliacoes/editar/${avaliacaoId}/preview` : '/avaliacoes/nova/preview')
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Selecionar Áreas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha os blocos de atividades que serão aplicados nesta avaliação.
        </p>
      </div>

      <div className="space-y-4">
        {selectedCount > 0 && (
          <Badge variant="default">{selectedCount} atividade{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}</Badge>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : blocos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum bloco disponível.
          </p>
        ) : (
          <div className="space-y-2">
            {sortByField(blocos, 'titulo').map((bloco) => {
              const atividadesSelecionadas = selectedByBloco[bloco.id] ?? []
              const isSelected = atividadesSelecionadas.length > 0
              const expanded = expandedBlocos[bloco.id] ?? isSelected

              return (
                <div
                  key={bloco.id}
                  className={cn(
                    'w-full p-4 rounded-xl border transition-all duration-150 text-left',
                    isSelected
                      ? 'border-primary bg-primary-light'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                >
                  <button type="button" onClick={() => toggleExpand(bloco.id)} className="w-full flex items-start gap-3 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{bloco.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {atividadesSelecionadas.length} de {bloco.atividades.length} atividade{bloco.atividades.length !== 1 ? 's' : ''} selecionada{bloco.atividades.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckSquare size={18} className="text-primary shrink-0 mt-0.5" weight="fill" />
                    ) : (
                      <Square size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    {expanded ? <CaretUp size={18} className="text-muted-foreground shrink-0 mt-0.5" /> : <CaretDown size={18} className="text-muted-foreground shrink-0 mt-0.5" />}
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-2 pl-1">
                      {bloco.atividades.map((atividade) => {
                        const checked = atividadesSelecionadas.includes(atividade.id)
                        return (
                          <button
                            key={atividade.id}
                            type="button"
                            onClick={() => toggleAtividade(bloco.id, atividade.id)}
                            className={cn(
                              'w-full flex items-start justify-between rounded-lg border px-3 py-2 cursor-pointer',
                              checked ? 'border-primary bg-primary/10' : 'border-border bg-background'
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{atividade.titulo}</p>
                              {atividade.enunciado && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{atividade.enunciado}</p>
                              )}
                            </div>
                            {checked ? (
                              <CheckSquare size={16} className="text-primary shrink-0 ml-2 mt-0.5" weight="fill" />
                            ) : (
                              <Square size={16} className="text-muted-foreground shrink-0 ml-2 mt-0.5" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {error && <p className="text-xs text-danger font-medium">{error}</p>}

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => navigate(isEditing && avaliacaoId ? `/avaliacoes/editar/${avaliacaoId}/alunos` : '/avaliacoes/nova/alunos')}
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
          <Button onClick={handleNext}>
            Revisar
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
