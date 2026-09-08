import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowClockwise, Sparkle } from '@phosphor-icons/react'
import { cadastrarRelatorio, previewInsumosRelatorio } from '@/services/relatorioService'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { useRelatorioWizardStore } from '@/stores/relatorioWizardStore'
import { RelatorioDadosEncontrados } from './RelatorioDadosEncontrados'

export function RelatorioStep4Geracao() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const alunoId = useRelatorioWizardStore((s) => s.alunoId)
  const dataInicio = useRelatorioWizardStore((s) => s.dataInicio)
  const dataFim = useRelatorioWizardStore((s) => s.dataFim)
  const tipoPeriodo = useRelatorioWizardStore((s) => s.tipoPeriodo)
  const setStep = useRelatorioWizardStore((s) => s.setStep)

  // Mesma queryKey da etapa anterior — vem do cache, sem nova espera pro professor.
  const { data: preview } = useQuery({
    queryKey: ['relatorio-preview-insumos', alunoId, dataInicio, dataFim],
    queryFn: () => previewInsumosRelatorio({ alunoId: alunoId!, dataInicio, dataFim }),
    enabled: !!alunoId,
  })

  const gerarMutation = useMutation({
    mutationFn: () => cadastrarRelatorio({ alunoId: alunoId!, dataInicio, dataFim, tipoPeriodo }),
    onSuccess: (resultado) => {
      if (resultado.sucesso) {
        success('Relatório em geração', 'Você será avisado por notificação quando estiver pronto.')
      } else {
        showError('Relatório criado com pendência', resultado.mensagem)
      }
      navigate(`/relatorios/${resultado.relatorio.id}`)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Sparkle size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Gerar relatório</h2>
      </div>

      {gerarMutation.isPending ? (
        <div className="rounded-lg border border-border p-6 flex flex-col items-center gap-3 text-center">
          <span className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">
            Enviando os dados para gerar o relatório pedagógico…
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Dados utilizados:</p>
          <div className="rounded-lg border border-border p-4">
            {preview ? (
              <RelatorioDadosEncontrados preview={preview} mostrarCadastro />
            ) : (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            )}
          </div>

          {gerarMutation.isError && <p className="text-sm text-danger">Não foi possível gerar o relatório. Tente novamente.</p>}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('levantamento')
                navigate('/relatorios/novo/levantamento')
              }}
            >
              Voltar
            </Button>
            <Button type="button" onClick={() => gerarMutation.mutate()} disabled={!preview}>
              {gerarMutation.isError ? (
                <>
                  <ArrowClockwise size={14} />
                  Tentar novamente
                </>
              ) : (
                'Gerar relatório'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
