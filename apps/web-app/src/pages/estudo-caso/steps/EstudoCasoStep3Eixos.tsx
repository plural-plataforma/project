import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Rows } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { buscarEixosEstudoCasoCatalogo } from '@/services/estudoCasoService'
import {
  useEstudoCasoWizardStore,
  estudoCasoCatalogoEixosCompleto,
  estudoCasoStepIndex,
  ESTUDO_CASO_WIZARD_STEPS,
} from '@/stores/estudoCasoWizardStore'

export function EstudoCasoStep3Eixos() {
  const navigate = useNavigate()
  const eixosSelecionadosIds = useEstudoCasoWizardStore((s) => s.eixosSelecionadosIds)
  const toggleEixo = useEstudoCasoWizardStore((s) => s.toggleEixo)
  const anotacoesPorEixo = useEstudoCasoWizardStore((s) => s.anotacoesPorEixo)
  const setAnotacaoEixo = useEstudoCasoWizardStore((s) => s.setAnotacaoEixo)
  const setStep = useEstudoCasoWizardStore((s) => s.setStep)

  const { data: eixos = [], isLoading } = useQuery({
    queryKey: ['estudo-caso-eixos-catalogo'],
    queryFn: buscarEixosEstudoCasoCatalogo,
  })

  const okResultado =
    eixos.length > 0 && estudoCasoCatalogoEixosCompleto(
      eixos.map((e) => e.id),
      eixosSelecionadosIds
    )

  const qtdSel = eixosSelecionadosIds.filter((id) => eixos.some((e) => e.id === id)).length

  function voltar() {
    setStep('contexto')
    navigate('/estudo-caso/nova/contexto')
  }

  function avancar() {
    setStep('resultado')
    navigate('/estudo-caso/nova/resultado')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Rows size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Eixos pedagógicos</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        É obrigatório marcar <strong>todos os {eixos.length || '…'} eixos</strong> do catálogo (PAEE). Observações por eixo continuam opcionais.
      </p>

      {!isLoading && eixos.length > 0 && (
        <p className="text-xs font-medium text-foreground">
          Selecionados: {qtdSel} de {eixos.length}
        </p>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando eixos…</p>
      ) : (
        <div className="space-y-4">
          {eixos.map((eixo) => {
            const sel = eixosSelecionadosIds.includes(eixo.id)
            return (
              <div
                key={eixo.id}
                className={`rounded-lg border p-3 space-y-2 transition-colors ${
                  sel ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleEixo(eixo.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center text-xs font-bold ${
                      sel ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40'
                    }`}
                  >
                    {sel ? '✓' : ''}
                  </span>
                  <span className="flex-1">
                    <span className="font-semibold text-foreground block">{eixo.rotulo}</span>
                    {eixo.descricaoHint && (
                      <span className="text-xs text-muted-foreground block mt-1">{eixo.descricaoHint}</span>
                    )}
                  </span>
                </button>
                {sel && (
                  <textarea
                    rows={2}
                    value={anotacoesPorEixo[eixo.id] ?? ''}
                    onChange={(ev) => setAnotacaoEixo(eixo.id, ev.target.value)}
                    placeholder="Observação opcional neste eixo…"
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ml-8 max-w-[calc(100%-2rem)]"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={voltar}>
          Voltar
        </Button>
        <Button type="button" onClick={avancar} disabled={!okResultado}>
          Gerar rascunho
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Etapa {estudoCasoStepIndex('eixos') + 1} de {ESTUDO_CASO_WIZARD_STEPS.length}
      </p>
    </div>
  )
}
