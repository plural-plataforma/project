import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface EstudoCasoExcluirDialogProps {
  open: boolean
  onClose: () => void
  titulo: string
  onConfirm: () => void
  isPending?: boolean
}

export function EstudoCasoExcluirDialog({
  open,
  onClose,
  titulo,
  onConfirm,
  isPending,
}: EstudoCasoExcluirDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir estudo de caso?</DialogTitle>
          <DialogDescription>
            O registro <span className="font-semibold text-foreground">{titulo}</span> será removido permanentemente,
            incluindo o rascunho simulado. Esta ação não pode ser desfeita.
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
