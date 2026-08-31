import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileText, Warning } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { previewInsumosRelatorio, cadastrarRelatorio } from '@/services/relatorioService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { RELATORIO_TIPO_PERIODO_LABELS, type RelatorioTipoPeriodoCodigo } from '@/types/relatorio'

export interface NovoRelatorioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alunoId: number
  onCriado: (relatorioId: number) => void
}

export function NovoRelatorioDialog({ open, onOpenChange, alunoId, onCriado }: NovoRelatorioDialogProps) {
  const { success, error: showError } = useToast()
  const hoje = dayjs()

  const [tipoPeriodo, setTipoPeriodo] = useState<RelatorioTipoPeriodoCodigo>(1)
  const [dataInicio, setDataInicio] = useState(hoje.startOf('year').format('YYYY-MM-DD'))
  const [dataFim, setDataFim] = useState(hoje.format('YYYY-MM-DD'))

  const periodoValido = !!dataInicio && !!dataFim && dataInicio <= dataFim

  const { data: preview, isFetching: carregandoPreview } = useQuery({
    queryKey: ['relatorio-preview-insumos', alunoId, dataInicio, dataFim],
    queryFn: () => previewInsumosRelatorio({ alunoId, dataInicio, dataFim }),
    enabled: open && periodoValido,
  })

  const gerarMutation = useMutation({
    mutationFn: () => cadastrarRelatorio({ alunoId, dataInicio, dataFim, tipoPeriodo }),
    onSuccess: (resultado) => {
      if (resultado.sucesso) {
        success('Relatório gerado', 'Revise as seções antes de finalizar.')
      } else {
        showError('Relatório criado com pendência', resultado.mensagem)
      }
      onOpenChange(false)
      onCriado(resultado.relatorio.id)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={22} /> Novo Relatório Pedagógico
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Tipo de período</label>
            <Select value={String(tipoPeriodo)} onValueChange={(v) => setTipoPeriodo(Number(v) as RelatorioTipoPeriodoCodigo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{RELATORIO_TIPO_PERIODO_LABELS[0]}</SelectItem>
                <SelectItem value="1">{RELATORIO_TIPO_PERIODO_LABELS[1]}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Data início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            <Input label="Data fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>

          {periodoValido && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1.5">
              {carregandoPreview ? (
                <p className="text-muted-foreground">Verificando dados disponíveis…</p>
              ) : preview ? (
                <>
                  <p className="text-foreground">
                    Estudo de caso: {preview.temEstudoCaso ? 'sim' : 'não encontrado'} · PAEE vigente: {preview.quantidadePlanejamentosVigentes} ·{' '}
                    Relatos no período: {preview.quantidadeRelatosNoPeriodo} · Avaliações no período: {preview.quantidadeAvaliacoesNoPeriodo}
                  </p>
                  {preview.avisos.length > 0 && (
                    <div className="flex items-start gap-1.5 text-amber-foreground">
                      <Warning size={14} className="mt-0.5 shrink-0" />
                      <p>{preview.avisos.join(' ')}</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!periodoValido}
            loading={gerarMutation.isPending}
            onClick={() => gerarMutation.mutate()}
          >
            Gerar relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
