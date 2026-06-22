import { Users, Brain, Lightning, CheckSquare, Plus, CalendarBlank, X } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sortByField } from '@/lib/utils'
import type { Planejamento } from '@/types/planejamento'
import dayjs from 'dayjs'

export type VincModalType = 'alunos' | 'habilidades' | 'estrategias' | 'avaliacoes'

export interface PlanejamentoVisaoGeralTabProps {
  plan: Planejamento
  editingInfo: boolean
  formApelido: string
  setFormApelido: (v: string) => void
  formDataInicio: string
  setFormDataInicio: (v: string) => void
  formDataFim: string
  setFormDataFim: (v: string) => void
  formDescricao: string
  setFormDescricao: (v: string) => void
  saving: boolean
  onSave: () => void
  onCancelEdit: () => void
  onOpenVincModal: (type: VincModalType) => void
  onDesvincularHabilidade?: (habilidadeId: number) => void
  desvinculandoHabilidadeId?: number | null
}

const formatDate = (d: string) => dayjs(d).format('DD/MM/YYYY')

export function PlanejamentoVisaoGeralTab({
  plan,
  editingInfo,
  formApelido,
  setFormApelido,
  formDataInicio,
  setFormDataInicio,
  formDataFim,
  setFormDataFim,
  formDescricao,
  setFormDescricao,
  saving,
  onSave,
  onCancelEdit,
  onOpenVincModal,
  onDesvincularHabilidade,
  desvinculandoHabilidadeId = null,
}: PlanejamentoVisaoGeralTabProps) {
  return (
    <div className="space-y-4">
      {editingInfo ? (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <Input label="Nome do PAEE" value={formApelido} onChange={(e) => setFormApelido(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data de início" type="date" value={formDataInicio} onChange={(e) => setFormDataInicio(e.target.value)} />
              <Input label="Data de fim" type="date" value={formDataFim} onChange={(e) => setFormDataFim(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Descrição</label>
              <textarea
                rows={3}
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onCancelEdit}>Cancelar</Button>
              <Button size="sm" loading={saving} onClick={onSave}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarBlank size={14} />
                <span>{formatDate(plan.dataInicio)} → {formatDate(plan.dataFim)}</span>
              </div>
              {plan.descicaoPlanejamento && (
                <p className="text-sm text-foreground leading-relaxed w-full">{plan.descicaoPlanejamento}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Alunos ({plan.alunos?.length ?? 0})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onOpenVincModal('alunos')}>
                <Plus size={14} /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!plan.alunos?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum aluno vinculado.</p>
            ) : (
              <div className="space-y-2">
                {sortByField(plan.alunos, 'nomeCompleto').map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <div className="h-6 w-6 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {a.nomeCompleto[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1 truncate">{a.nomeCompleto}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain size={16} className="text-primary" />
                Habilidades ({plan.habilidades?.length ?? 0})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onOpenVincModal('habilidades')}>
                <Plus size={14} /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!plan.habilidades?.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma habilidade vinculada.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortByField(plan.habilidades, 'descricao').map((h) => {
                  const label = h.resumo || h.descricao || `Habilidade ${h.id}`
                  const removendo = desvinculandoHabilidadeId === h.id

                  return (
                    <Badge key={h.id} variant="default" className="gap-1 pr-1 max-w-full">
                      <span className="truncate">{label}</span>
                      {onDesvincularHabilidade && (
                        <button
                          type="button"
                          aria-label={`Desmarcar habilidade ${label}`}
                          disabled={removendo}
                          onClick={() => onDesvincularHabilidade(h.id)}
                          className="inline-flex shrink-0 rounded p-0.5 text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground disabled:opacity-50"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      )}
                    </Badge>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightning size={16} className="text-primary" />
                Estratégias ({plan.estrategias?.length ?? 0})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onOpenVincModal('estrategias')}>
                <Plus size={14} /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!plan.estrategias?.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma estratégia vinculada.</p>
            ) : (
              <div className="space-y-2">
                {sortByField(plan.estrategias, 'descricao').map((e) => (
                  <div key={e.id} className="text-sm text-foreground p-2 rounded-lg bg-muted">
                    {e.descricao}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckSquare size={16} className="text-primary" />
                Critérios Avaliativos ({plan.avaliacao?.length ?? 0})
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onOpenVincModal('avaliacoes')}>
                <Plus size={14} /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!plan.avaliacao?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum critério vinculado.</p>
            ) : (
              <div className="space-y-2">
                {plan.avaliacao.map((v) => (
                  <div key={v.id} className="text-sm text-foreground p-2 rounded-lg bg-muted">
                    {v.descricao}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
