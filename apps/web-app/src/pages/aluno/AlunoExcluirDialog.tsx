import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AlunoExcluirDialogProps {
  open: boolean
  onClose: () => void
  nomeCompleto: string
  onConfirm: () => void
  isPending?: boolean
}

export function AlunoExcluirDialog({
  open,
  onClose,
  nomeCompleto,
  onConfirm,
  isPending,
}: AlunoExcluirDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir aluno?</DialogTitle>
          <DialogDescription>
            O cadastro de <span className="font-semibold text-foreground">{nomeCompleto}</span> será removido
            permanentemente, incluindo vínculos com planejamentos e registros em avaliações diagnósticas. Esta ação
            não pode ser desfeita.
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
