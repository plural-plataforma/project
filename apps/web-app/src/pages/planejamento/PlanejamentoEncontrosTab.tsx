import { MagicWand, Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Planejamento } from '@/types/planejamento'

export interface LinhaPaeeEnc {
  key: string
  dataEnc: string
  textoPlanejado: string
  habilidadeId: number | null
  estrategiaId: number | null
}

export interface PlanejamentoEncontrosTabProps {
  plan: Planejamento
  encLinhas: LinhaPaeeEnc[]
  setEncLinhas: React.Dispatch<React.SetStateAction<LinhaPaeeEnc[]>>
  saving: boolean
  onSave: () => void
  sugerindoDatas: boolean
  onSugerirDatas: () => void
  onNovaLinhaKey: () => string
}

export function PlanejamentoEncontrosTab({
  plan,
  encLinhas,
  setEncLinhas,
  saving,
  onSave,
  sugerindoDatas,
  onSugerirDatas,
  onNovaLinhaKey,
}: PlanejamentoEncontrosTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Grade de encontros</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onSugerirDatas}
                loading={sugerindoDatas}
              >
                <MagicWand size={14} /> Sugestão de datas
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setEncLinhas((rows) =>
                    [...rows, {
                      key: onNovaLinhaKey(),
                      dataEnc: plan.dataInicio,
                      textoPlanejado: '',
                      habilidadeId: null,
                      estrategiaId: null,
                    }].sort((a, b) => a.dataEnc.localeCompare(b.dataEnc)),
                  )
                }
              >
                <Plus size={14} /> Nova linha
              </Button>
              <Button
                size="sm"
                loading={saving}
                type="button"
                onClick={onSave}
              >
                Salvar encontros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!encLinhas.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma linha — vincule um aluno com dias de atendimento ou use Nova linha.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse border border-border min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left border-r border-border px-2 py-2 font-medium">Data</th>
                  <th className="text-left border-r border-border px-2 py-2 font-medium">Planejado</th>
                  <th className="text-left border-r border-border px-2 py-2 font-medium">Habilidade</th>
                  <th className="text-left border-r border-border px-2 py-2 font-medium">Estratégia</th>
                  <th className="w-[44px]" aria-label="Remover" />
                </tr>
              </thead>
              <tbody>
                {encLinhas.map((linha, idx, arr) => (
                  <tr key={linha.key} className="border-b border-border odd:bg-muted/10">
                    <td className="border-r align-top p-2">
                      <input
                        type="date"
                        value={linha.dataEnc}
                        max={plan.dataFim}
                        min={plan.dataInicio}
                        aria-label={`Data do encontro ${idx + 1}`}
                        onChange={(ev) =>
                          setEncLinhas(arr.map((r) =>
                            r.key === linha.key ? { ...r, dataEnc: ev.target.value } : r,
                          ))
                        }
                        className="rounded border border-input bg-background px-1 py-1 w-full max-w-44"
                      />
                    </td>
                    <td className="border-r align-top p-2 w-[22%]">
                      <textarea
                        rows={2}
                        aria-label={`Conteúdo planejado encontro ${idx + 1}`}
                        value={linha.textoPlanejado ?? ''}
                        onChange={(ev) =>
                          setEncLinhas(arr.map((r) =>
                            r.key === linha.key ? { ...r, textoPlanejado: ev.target.value } : r,
                          ))
                        }
                            className="w-full rounded border border-input bg-background px-2 py-1 text-xs resize-y min-h-12"
                          />
                        </td>
                    <td className="border-r align-top p-2 w-[16%]">
                      <select
                        aria-label={`Habilidade encontro ${idx + 1}`}
                        className="w-full rounded border border-input bg-background px-1 py-1 text-xs"
                        value={linha.habilidadeId ?? ''}
                        onChange={(ev) => {
                          const raw = ev.target.value
                          setEncLinhas(arr.map((r) =>
                            r.key === linha.key
                              ? { ...r, habilidadeId: raw === '' ? null : Number(raw) }
                              : r,
                          ))
                        }}
                      >
                        <option value="">—</option>
                        {(plan.habilidades ?? []).map((h) => (
                          <option key={h.id} value={h.id}>{h.resumo || h.descricao || h.id}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border-r align-top p-2 w-[16%]">
                      <select
                        aria-label={`Estratégia encontro ${idx + 1}`}
                        className="w-full rounded border border-input bg-background px-1 py-1 text-xs"
                        value={linha.estrategiaId ?? ''}
                        onChange={(ev) => {
                          const raw = ev.target.value
                          setEncLinhas(arr.map((r) =>
                            r.key === linha.key
                              ? { ...r, estrategiaId: raw === '' ? null : Number(raw) }
                              : r,
                          ))
                        }}
                      >
                        <option value="">—</option>
                        {(plan.estrategias ?? []).map((est) => (
                          <option key={est.id} value={est.id}>{est.descricao}</option>
                        ))}
                      </select>
                    </td>
                    <td className="align-top p-1 text-center">
                      <button
                        type="button"
                        aria-label={`Remover linha ${idx + 1}`}
                        className="inline-flex rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setEncLinhas(arr.filter((r) => r.key !== linha.key))}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground px-1">
        As datas são pré-preenchidas com base no primeiro aluno vinculado (dias da semana e frequência do cadastro).
        Use &quot;Sugestão de datas&quot; para incluir novas datas ou &quot;Nova linha&quot; para adicionar manualmente.
      </p>
    </div>
  )
}
