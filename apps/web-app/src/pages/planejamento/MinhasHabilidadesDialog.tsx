import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeSlash, PencilSimple, Plus } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NIVEL_ENSINO_MAP } from '@/config/nivelEnsino'
import { atualizarHabilidade, buscarHabilidades } from '@/services/habilidadeService'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { sortByField } from '@/lib/utils'
import type { Habilidade } from '@/types/habilidade'

interface MinhasHabilidadesDialogProps {
  open: boolean
  onClose: () => void
  onNova: () => void
  onEditar: (habilidade: Habilidade) => void
}

export function MinhasHabilidadesDialog({ open, onClose, onNova, onEditar }: MinhasHabilidadesDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const { data: habilidades = [], isLoading } = useQuery({
    queryKey: ['habilidades'],
    queryFn: buscarHabilidades,
    enabled: open,
  })

  const minhas = habilidades.filter((h) => h.ehPropria)
  const ativas = sortByField(minhas.filter((h) => h.ativo !== false), 'descricao')
  const desativadas = sortByField(minhas.filter((h) => h.ativo === false), 'descricao')

  const alternarAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) => atualizarHabilidade({ id, ativo }),
    onSuccess: (_data, { ativo }) => {
      success(ativo ? 'Habilidade reativada' : 'Habilidade desativada')
      void qc.invalidateQueries({ queryKey: ['habilidades'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  function renderLinha(habilidade: Habilidade) {
    const ativa = habilidade.ativo !== false
    return (
      <div key={habilidade.id} className="flex items-stretch gap-1.5">
        <div
          className={`flex-1 flex items-start gap-2 px-3 py-2.5 rounded-lg border border-border text-sm ${
            ativa ? 'text-foreground' : 'text-muted-foreground bg-muted/40'
          }`}
        >
          <span className="flex-1 leading-snug">{habilidade.descricao}</span>
          {!ativa && <Badge variant="muted" className="shrink-0 text-[10px]">Desativada</Badge>}
          {habilidade.idNivelEnsino && (
            <Badge variant="muted" className="shrink-0 text-[10px]">
              {NIVEL_ENSINO_MAP[habilidade.idNivelEnsino] ?? habilidade.idNivelEnsino}
            </Badge>
          )}
        </div>
        <div className="flex flex-col justify-center gap-1">
          <button
            type="button"
            aria-label="Editar habilidade"
            title="Editar ou excluir habilidade"
            onClick={() => onEditar(habilidade)}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <PencilSimple size={14} />
          </button>
          <button
            type="button"
            aria-label={ativa ? 'Desativar habilidade' : 'Reativar habilidade'}
            title={ativa ? 'Desativar habilidade' : 'Reativar habilidade'}
            onClick={() => alternarAtivoMutation.mutate({ id: habilidade.id, ativo: !ativa })}
            disabled={alternarAtivoMutation.isPending}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
          >
            {ativa ? <EyeSlash size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => { if (!aberto) onClose() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Minhas habilidades</DialogTitle>
          <DialogDescription>
            Habilidades criadas por você. Só você as vê e pode usá-las nos seus PAEEs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onNova}>
            <Plus size={14} /> Nova habilidade
          </Button>
          <span className="text-xs text-muted-foreground">
            {ativas.length} ativa{ativas.length !== 1 ? 's' : ''}
            {desativadas.length > 0 && ` · ${desativadas.length} desativada${desativadas.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>}
          {!isLoading && minhas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Você ainda não criou nenhuma habilidade.
            </p>
          )}
          {ativas.map(renderLinha)}
          {desativadas.map(renderLinha)}
        </div>
      </DialogContent>
    </Dialog>
  )
}
