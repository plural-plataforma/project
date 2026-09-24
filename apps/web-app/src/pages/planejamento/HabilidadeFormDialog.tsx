import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { NIVEL_ENSINO_MAP } from '@/config/nivelEnsino'
import { atualizarHabilidade, criarHabilidade, excluirHabilidade } from '@/services/habilidadeService'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import type { Habilidade } from '@/types/habilidade'

const schema = z.object({
  idNivelEnsino: z.string().min(1, 'Nível de ensino obrigatório'),
  tipo: z.string().trim().min(1, 'Tipo obrigatório'),
  descricao: z.string().trim().min(1, 'Descrição obrigatória'),
  resumo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const VALORES_VAZIOS: FormData = { idNivelEnsino: '', tipo: '', descricao: '', resumo: '' }

interface HabilidadeFormDialogProps {
  open: boolean
  habilidade?: Habilidade | null
  onClose: () => void
  onSaved: (habilidade: Habilidade, criada: boolean) => void
  onDeleted?: (habilidadeId: number) => void
}

export function HabilidadeFormDialog({ open, habilidade, onClose, onSaved, onDeleted }: HabilidadeFormDialogProps) {
  const { success, error: showError } = useToast()
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  function fechar() {
    setConfirmandoExclusao(false)
    onClose()
  }
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VALORES_VAZIOS })

  useEffect(() => {
    if (!open) return
    reset(
      habilidade
        ? {
            idNivelEnsino: habilidade.idNivelEnsino ? String(habilidade.idNivelEnsino) : '',
            tipo: habilidade.tipo ?? '',
            descricao: habilidade.descricao ?? '',
            resumo: habilidade.resumo ?? '',
          }
        : VALORES_VAZIOS,
    )
  }, [open, habilidade, reset])

  const salvarMutation = useMutation({
    mutationFn: async (dados: FormData): Promise<{ salva: Habilidade; criada: boolean }> => {
      const payload = {
        idNivelEnsino: Number(dados.idNivelEnsino),
        tipo: dados.tipo.trim(),
        descricao: dados.descricao.trim(),
        resumo: dados.resumo?.trim() || undefined,
      }
      if (habilidade) {
        await atualizarHabilidade({ id: habilidade.id, ...payload })
        return { salva: { ...habilidade, ...payload, resumo: payload.resumo ?? habilidade.resumo }, criada: false }
      }
      return { salva: await criarHabilidade(payload), criada: true }
    },
    onSuccess: ({ salva, criada }) => {
      success(criada ? 'Habilidade criada!' : 'Habilidade atualizada!')
      onSaved(salva, criada)
      fechar()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const excluirMutation = useMutation({
    mutationFn: (habilidadeId: number) => excluirHabilidade(habilidadeId),
    onSuccess: (_data, habilidadeId) => {
      success('Habilidade excluída')
      onDeleted?.(habilidadeId)
      fechar()
    },
    onError: (err: unknown) => {
      setConfirmandoExclusao(false)
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  return (
    <Dialog open={open} onOpenChange={(aberto) => { if (!aberto) fechar() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{habilidade ? 'Editar habilidade' : 'Nova habilidade'}</DialogTitle>
          <DialogDescription>Só você vê e usa esta habilidade nos seus PAEEs.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.stopPropagation()
            void handleSubmit((dados) => salvarMutation.mutate(dados))(e)
          }}
        >
          <div className="space-y-1">
            <label htmlFor="habilidade-nivel" className="text-sm font-medium text-foreground">
              Nível de ensino
            </label>
            <select
              id="habilidade-nivel"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('idNivelEnsino')}
            >
              <option value="">Selecione...</option>
              {Object.entries(NIVEL_ENSINO_MAP).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
            {errors.idNivelEnsino && (
              <p className="text-xs text-danger">{errors.idNivelEnsino.message}</p>
            )}
          </div>

          <Input label="Tipo" error={errors.tipo?.message} {...register('tipo')} />
          <Input label="Descrição" error={errors.descricao?.message} {...register('descricao')} />

          <div className="space-y-1">
            <label htmlFor="habilidade-resumo" className="text-sm font-medium text-foreground">
              Resumo (opcional)
            </label>
            <textarea
              id="habilidade-resumo"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              {...register('resumo')}
            />
          </div>

          {habilidade && confirmandoExclusao && (
            <div className="rounded-lg border border-danger/40 bg-danger/5 p-3 space-y-2">
              <p className="text-sm text-foreground">
                Excluir esta habilidade? Essa ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmandoExclusao(false)}>
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  loading={excluirMutation.isPending}
                  onClick={() => excluirMutation.mutate(habilidade.id)}
                >
                  Confirmar exclusão
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            {habilidade && !confirmandoExclusao && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10 sm:mr-auto"
                onClick={() => setConfirmandoExclusao(true)}
              >
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={salvarMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
