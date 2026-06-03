import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Rows } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { buscarEixosEstudoCasoCatalogo } from '@/services/estudoCasoService'
import {
  useEstudoCasoWizardStore,
  estudoCasoCatalogoEixosCompleto,
  estudoCasoStepIndex,
  ESTUDO_CASO_WIZARD_STEPS,
} from '@/stores/estudoCasoWizardStore'
import { useSalvarGerarEstudoCaso } from '@/pages/estudo-caso/useSalvarGerarEstudoCaso'

export function EstudoCasoStep3Eixos() {
  const navigate = useNavigate()
  const eixosSelecionadosIds = useEstudoCasoWizardStore((s) => s.eixosSelecionadosIds)
  const catalogoEixoIds = useEstudoCasoWizardStore((s) => s.catalogoEixoIds)
  const anotacoesPorEixo = useEstudoCasoWizardStore((s) => s.anotacoesPorEixo)
  const setAnotacaoEixo = useEstudoCasoWizardStore((s) => s.setAnotacaoEixo)
  const setStep = useEstudoCasoWizardStore((s) => s.setStep)

  const salvarMutation = useSalvarGerarEstudoCaso()

  const { data: eixos = [], isLoading } = useQuery({
    queryKey: ['estudo-caso-eixos-catalogo'],
    queryFn: buscarEixosEstudoCasoCatalogo,
  })

  const idsCatalogo = eixos.length > 0 ? eixos.map((e) => e.id) : catalogoEixoIds
  const okGerar = estudoCasoCatalogoEixosCompleto(idsCatalogo, eixosSelecionadosIds)

  function voltar() {
    setStep('contexto')
    navigate('/estudo-caso/nova/contexto')
  }

  function gerarEstudo() {
    salvarMutation.mutate(undefined, {
      onSuccess: () => {
        setStep('resultado')
        navigate('/estudo-caso/nova/resultado')
      },
    })
  }

  return (
    <>
      <LoadingScreen visible={salvarMutation.isPending} message="Gerando estudo de caso…" />
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Rows size={22} weight="duotone" />
          <h2 className="text-lg font-bold text-foreground">Eixos pedagógicos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Registre as observações do aluno, feitas a partir da entrevista inicial, conversa com o professor,
          observações em sala de aula e no AEE.
        </p>

        {!isLoading && eixos.length > 0 && (
          <p className="text-xs font-medium text-foreground">
            {eixos.length} eixos do catálogo (todos obrigatórios — observações opcionais por eixo).
          </p>
        )}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando eixos…</p>
        ) : (
          <div className="space-y-4">
            {eixos.map((eixo) => (
              <div
                key={eixo.id}
                className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-primary bg-primary text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="flex-1">
                    <span className="font-semibold text-foreground block">{eixo.rotulo}</span>
                    {eixo.descricaoHint && (
                      <span className="text-xs text-muted-foreground block mt-1">{eixo.descricaoHint}</span>
                    )}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={anotacoesPorEixo[eixo.id] ?? ''}
                  onChange={(ev) => setAnotacaoEixo(eixo.id, ev.target.value)}
                  placeholder="Observação opcional neste eixo…"
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ml-8 max-w-[calc(100%-2rem)]"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={voltar} disabled={salvarMutation.isPending}>
            Voltar
          </Button>
          <Button type="button" onClick={gerarEstudo} disabled={!okGerar || salvarMutation.isPending} loading={salvarMutation.isPending}>
            Gerar estudo de caso
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Etapa {estudoCasoStepIndex('eixos') + 1} de {ESTUDO_CASO_WIZARD_STEPS.length - 1}
        </p>
      </div>
    </>
  )
}
