import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PlanejamentoExcluirDialogProps {
  open: boolean
  onClose: () => void
  apelido: string
  onConfirm: () => void
  isPending?: boolean
}

export function PlanejamentoExcluirDialog({
  open,
  onClose,
  apelido,
  onConfirm,
  isPending,
}: PlanejamentoExcluirDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir PAEE?</DialogTitle>
          <DialogDescription>
            O plano <span className="font-semibold text-foreground">{apelido}</span> será removido
            permanentemente, incluindo vínculos com alunos, habilidades, estratégias e critérios de
            avaliação. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} loading={isPending}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
