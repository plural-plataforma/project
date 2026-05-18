import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { buscarEstudoCasoPorId, gerarTextoSimuladoEstudoCaso } from '@/services/estudoCasoService'

interface EstudoCasoDetalheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estudoId: number | null
}

export function EstudoCasoDetalheDialog({ open, onOpenChange, estudoId }: EstudoCasoDetalheDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()

  const {
    data: detalhe,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['estudo-caso', estudoId],
    queryFn: () => buscarEstudoCasoPorId(estudoId!),
    enabled: open && estudoId != null && estudoId > 0,
  })

  const gerarMutation = useMutation({
    mutationFn: () => gerarTextoSimuladoEstudoCaso(estudoId!),
    onSuccess: (d) => {
      qc.setQueryData(['estudo-caso', estudoId], d)
      qc.invalidateQueries({ queryKey: ['estudos-caso-aluno', d.alunoId] })
      success('Rascunho gerado', 'Revise o texto antes de usar oficialmente.')
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  async function copiarTexto() {
    const t = detalhe?.textoSimulado?.trim()
    if (!t) return
    try {
      await navigator.clipboard.writeText(t)
      success('Copiado', 'Texto enviado para a área de transferência.')
    } catch {
      showError('Não foi possível copiar', 'Seu navegador pode ter bloqueado o acesso à área de transferência.')
    }
  }

  const feedbackErro =
    isError && error instanceof Error ? error.message : isError ? 'Não foi possível carregar o estudo de caso.' : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto gap-3">
        <DialogHeader>
          <DialogTitle>{detalhe?.titulo ?? 'Estudo de caso'}</DialogTitle>
          <DialogDescription>
            Conteúdo de apoio ao PAEE. Texto automático é marcado como <strong>rascunho simulado</strong> e exige revisão.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {feedbackErro && <p className="text-sm text-destructive">{feedbackErro}</p>}

        {detalhe && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contexto / situação</p>
              <p className="text-foreground whitespace-pre-wrap mt-1">{detalhe.contextoSituacao}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Eixos e anotações</p>
              <ul className="mt-2 space-y-2">
                {detalhe.itensEixo.map((item) => (
                  <li key={`${item.eixoCatalogoId}-${item.codigoEixo}`} className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="font-semibold text-foreground">{item.rotuloEixo}</p>
                    {item.anotacao?.trim() ? (
                      <p className="text-muted-foreground whitespace-pre-wrap mt-1">{item.anotacao}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic mt-1">Sem anotação.</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Texto simulado (rascunho)</p>
                <div className="flex flex-wrap gap-2">
                  {detalhe.textoSimulado?.trim() && (
                    <Button type="button" size="sm" variant="outline" onClick={copiarTexto}>
                      <Copy size={14} />
                      Copiar
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    loading={gerarMutation.isPending}
                    onClick={() => gerarMutation.mutate()}
                  >
                    {detalhe.textoSimulado?.trim() ? 'Regenerar rascunho' : 'Gerar rascunho simulado'}
                  </Button>
                </div>
              </div>
              {detalhe.textoSimulado?.trim() ? (
                <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground max-h-[280px] overflow-y-auto">
                  {detalhe.textoSimulado}
                </pre>
              ) : (
                <p className="mt-2 text-muted-foreground text-sm">Ainda não há texto gerado para este registro.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Atualizado em {new Date(detalhe.updatedAt).toLocaleString('pt-BR')}</span>
              <Badge variant="muted">#{detalhe.id}</Badge>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
