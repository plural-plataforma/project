import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { previewInsumosRelatorio } from '@/services/relatorioService'
import { Button } from '@/components/ui/button'
import {
  useRelatorioWizardStore,
  relatorioStepIndex,
  RELATORIO_WIZARD_STEPS,
} from '@/stores/relatorioWizardStore'
import { RelatorioDadosEncontrados } from './RelatorioDadosEncontrados'

export function RelatorioStep3Levantamento() {
  const navigate = useNavigate()
  const alunoId = useRelatorioWizardStore((s) => s.alunoId)
  const dataInicio = useRelatorioWizardStore((s) => s.dataInicio)
  const dataFim = useRelatorioWizardStore((s) => s.dataFim)
  const setStep = useRelatorioWizardStore((s) => s.setStep)

  const { data: preview, isFetching } = useQuery({
    queryKey: ['relatorio-preview-insumos', alunoId, dataInicio, dataFim],
    queryFn: () => previewInsumosRelatorio({ alunoId: alunoId!, dataInicio, dataFim }),
    enabled: !!alunoId,
  })

  function avancar() {
    setStep('geracao')
    navigate('/relatorios/novo/geracao')
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <MagnifyingGlass size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Informações encontradas</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Antes de gerar, veja quais dados já registrados na plataforma serão usados no período
        escolhido.
      </p>

      <div className="rounded-lg border border-border p-4">
        {isFetching || !preview ? (
          <p className="text-sm text-muted-foreground">Verificando dados disponíveis…</p>
        ) : (
          <RelatorioDadosEncontrados preview={preview} />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Seções sem dado suficiente ficam marcadas como "informação insuficiente" e podem ser
        preenchidas manualmente depois da geração — não é preciso ter tudo cadastrado.
      </p>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStep('periodo')
            navigate('/relatorios/novo/periodo')
          }}
        >
          Voltar
        </Button>
        <Button type="button" onClick={avancar} disabled={isFetching || !preview}>
          Continuar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Etapa {relatorioStepIndex('levantamento') + 1} de {RELATORIO_WIZARD_STEPS.length}
      </p>
    </div>
  )
}
