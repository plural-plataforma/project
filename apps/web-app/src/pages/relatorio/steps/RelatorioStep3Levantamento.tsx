import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { previewInsumosRelatorio } from '@/services/relatorioService'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/common/SkeletonCard'
import {
  useRelatorioWizardStore,
  relatorioStepIndex,
  RELATORIO_WIZARD_STEPS,
} from '@/stores/relatorioWizardStore'
import { RelatorioDadosEncontrados } from './RelatorioDadosEncontrados'

const LEVANTAMENTO_SKELETON_LARGURAS = ['w-3/5', 'w-4/5', 'w-3/4', 'w-2/3', 'w-4/5']

function LevantamentoSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Verificando dados disponíveis">
      {LEVANTAMENTO_SKELETON_LARGURAS.map((largura, index) => (
        <div key={index} className="flex items-center gap-2">
          <Skeleton className="h-[18px] w-[18px] shrink-0 rounded-full" />
          <Skeleton className={`h-4 ${largura}`} />
        </div>
      ))}
      <span className="sr-only">Verificando dados disponíveis…</span>
    </div>
  )
}

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
          <LevantamentoSkeleton />
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
