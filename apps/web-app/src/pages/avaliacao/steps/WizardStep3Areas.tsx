import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { buscarBlocosComAtividades } from '@/services/blocosService'
import { useAvaliacaoWizardStore } from '@/stores/avaliacaoWizardStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CheckSquare, Square } from '@phosphor-icons/react'
import { cn, sortByField } from '@/lib/utils'

const NIVEIS: { value: 'Facil' | 'Medio' | 'Dificil'; label: string }[] = [
  { value: 'Facil', label: 'Fácil' },
  { value: 'Medio', label: 'Médio' },
  { value: 'Dificil', label: 'Difícil' },
]

const ETAPAS: { value: string; label: string }[] = [
  { value: '1', label: 'Educação Infantil' },
  { value: '2', label: 'Ens. Fund. I — Anos Iniciais' },
  { value: '3', label: 'Ens. Fund. II — Anos Finais' },
  { value: '4', label: 'Ensino Médio' },
]

export function WizardStep3Areas() {
  const navigate = useNavigate()
  const { data: wizardData, updateData, markStepComplete, isEditing, avaliacaoId } = useAvaliacaoWizardStore()
  const [error, setError] = useState('')

  const [eixoId, setEixoId] = useState<number | null>(null)
  const [nivel, setNivel] = useState<string | null>(null)
  const [etapa, setEtapa] = useState<string | null>(null)

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
    () => Object.values(selectedByBloco).reduce((acc, ids) => acc + ids.length, 0),
    [selectedByBloco]
  )

  const blocoAtual = useMemo(() => blocos.find((b) => b.id === eixoId) ?? null, [blocos, eixoId])

  const niveisDisponiveis = useMemo(() => {
    if (!blocoAtual) return []
    const set = new Set(blocoAtual.atividades.map((a) => a.nivel).filter(Boolean))
    return NIVEIS.filter((n) => set.has(n.value))
  }, [blocoAtual])

  const etapasDisponiveis = useMemo(() => {
    if (!blocoAtual || !nivel) return []
    const atividadesFiltradas = blocoAtual.atividades.filter((a) => a.nivel === nivel)
    const set = new Set<string>()
    for (const a of atividadesFiltradas) {
      if (a.etapaMin) set.add(a.etapaMin)
      if (a.etapaMax) set.add(a.etapaMax)
    }
    return ETAPAS.filter((e) => set.has(e.value))
  }, [blocoAtual, nivel])

  const atividadesFiltradas = useMemo(() => {
    if (!blocoAtual || !nivel || !etapa) return []
    return blocoAtual.atividades.filter(
      (a) => a.nivel === nivel && (a.etapaMin === etapa || a.etapaMax === etapa)
    )
  }, [blocoAtual, nivel, etapa])

  function selectEixo(id: number) {
    setEixoId(id)
    setNivel(null)
    setEtapa(null)
  }

  function selectNivel(n: string) {
    setNivel(n)
    setEtapa(null)
  }

  function toggleAtividade(blocoId: number, atividadeId: number) {
    setSelectedByBloco((prev) => {
      const atual = prev[blocoId] ?? []
      const proximo = atual.includes(atividadeId)
        ? atual.filter((id) => id !== atividadeId)
        : [...atual, atividadeId]
      const next = { ...prev }
      if (proximo.length === 0) delete next[blocoId]
      else next[blocoId] = proximo
      return next
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

    updateData({ blocoIds: blocosSelecionados.map((b) => b.blocoId), blocos: blocosSelecionados })
    markStepComplete('areas')
    navigate(isEditing && avaliacaoId ? `/avaliacoes/editar/${avaliacaoId}/preview` : '/avaliacoes/nova/preview')
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Selecionar Áreas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha as atividades por eixo, nível de dificuldade e etapa de ensino.
        </p>
      </div>

      <div className="space-y-4">
        {selectedCount > 0 && (
          <Badge variant="default">
            {selectedCount} atividade{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}
          </Badge>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Passo 1 — Eixo */}
            <FilterSection step="1" label="Selecione o Eixo">
              <div className="flex flex-wrap gap-2">
                {sortByField(blocos, 'titulo').map((bloco) => {
                  const count = selectedByBloco[bloco.id]?.length ?? 0
                  const isActive = eixoId === bloco.id
                  return (
                    <button
                      key={bloco.id}
                      type="button"
                      onClick={() => selectEixo(bloco.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : count > 0
                            ? 'border-primary/60 bg-primary-light text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/40'
                      )}
                    >
                      {bloco.titulo}
                      {count > 0 && <span className="ml-1.5 text-xs opacity-80">({count})</span>}
                    </button>
                  )
                })}
              </div>
            </FilterSection>

            {/* Passo 2 — Nível */}
            {eixoId !== null && (
              <FilterSection step="2" label="Selecione o Nível de Dificuldade">
                {niveisDisponiveis.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum nível disponível para este eixo.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {niveisDisponiveis.map((n) => (
                      <button
                        key={n.value}
                        type="button"
                        onClick={() => selectNivel(n.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                          nivel === n.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/40'
                        )}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                )}
              </FilterSection>
            )}

            {/* Passo 3 — Etapa */}
            {eixoId !== null && nivel !== null && (
              <FilterSection step="3" label="Selecione a Etapa de Ensino">
                {etapasDisponiveis.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma etapa disponível para este nível.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {etapasDisponiveis.map((e) => (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() => setEtapa(e.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                          etapa === e.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/40'
                        )}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                )}
              </FilterSection>
            )}

            {/* Passo 4 — Atividades */}
            {eixoId !== null && nivel !== null && etapa !== null && (
              <FilterSection step="4" label="Selecione as Atividades">
                {atividadesFiltradas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma atividade encontrada com esses filtros.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {atividadesFiltradas.map((atividade) => {
                      const checked = (selectedByBloco[eixoId] ?? []).includes(atividade.id)
                      return (
                        <button
                          key={atividade.id}
                          type="button"
                          onClick={() => toggleAtividade(eixoId, atividade.id)}
                          className={cn(
                            'w-full flex items-start justify-between rounded-lg border px-3 py-2 cursor-pointer text-left',
                            checked ? 'border-primary bg-primary/10' : 'border-border bg-background'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{atividade.titulo}</p>
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
              </FilterSection>
            )}
          </>
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

function FilterSection({ step, label, children }: { step: string; label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {step}. {label}
      </p>
      {children}
    </div>
  )
}
