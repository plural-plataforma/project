import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, DownloadSimple, FilePdf, PencilSimple, Trash } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { downloadEstudoCasoDocx } from '@/lib/exportEstudoCasoDocx'
import { downloadEstudoCasoPdf } from '@/lib/exportEstudoCasoPdf'
import {
  atualizarEstudoCaso,
  buscarEixosEstudoCasoCatalogo,
  buscarEstudoCasoPorId,
  excluirEstudoCaso,
  gerarTextoSimuladoEstudoCaso,
} from '@/services/estudoCasoService'
import { EstudoCasoExcluirDialog } from '@/pages/estudo-caso/EstudoCasoExcluirDialog'
import { estudoCasoCatalogoEixosCompleto } from '@/stores/estudoCasoWizardStore'

interface EstudoCasoDetalheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  estudoId: number | null
}

export function EstudoCasoDetalheDialog({
  open,
  onOpenChange,
  estudoId,
}: EstudoCasoDetalheDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [editando, setEditando] = useState(false)
  const [excluirOpen, setExcluirOpen] = useState(false)
  const [editTitulo, setEditTitulo] = useState('')
  const [editContexto, setEditContexto] = useState('')
  const [editEixoIds, setEditEixoIds] = useState<number[]>([])
  const [editAnotacoes, setEditAnotacoes] = useState<Record<number, string>>({})

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

  const { data: eixosCatalogo = [], isLoading: loadingEixos } = useQuery({
    queryKey: ['estudo-caso-eixos-catalogo'],
    queryFn: buscarEixosEstudoCasoCatalogo,
    enabled: open && editando,
  })

  useEffect(() => {
    if (!open) {
      setEditando(false)
      setExcluirOpen(false)
    }
  }, [open])

  function handleDialogOpenChange(next: boolean) {
    if (!next) {
      setEditando(false)
      setExcluirOpen(false)
    }
    onOpenChange(next)
  }

  function iniciarEdicao() {
    if (!detalhe) return
    setEditTitulo(detalhe.titulo)
    setEditContexto(detalhe.contextoSituacao)
    setEditEixoIds(detalhe.itensEixo.map((i) => i.eixoCatalogoId))
    setEditAnotacoes(
      Object.fromEntries(detalhe.itensEixo.map((i) => [i.eixoCatalogoId, i.anotacao ?? '']))
    )
    setEditando(true)
  }

  function cancelarEdicao() {
    setEditando(false)
  }

  function toggleEditEixo(id: number) {
    setEditEixoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function setAnotacaoEixo(id: number, texto: string) {
    setEditAnotacoes((prev) => ({ ...prev, [id]: texto }))
  }

  const salvarEdicaoMutation = useMutation({
    mutationFn: async () => {
      if (!estudoId) throw new Error('Identificador inválido.')
      const titulo = editTitulo.trim()
      const contextoSituacao = editContexto.trim()
      if (!titulo || !contextoSituacao) throw new Error('Preencha título e contexto.')
      const idsCat = eixosCatalogo.map((e) => e.id)
      if (!estudoCasoCatalogoEixosCompleto(idsCat, editEixoIds))
        throw new Error(`Marque todos os ${idsCat.length} eixos do catálogo antes de salvar.`)
      const itensEixo = editEixoIds.map((eixoCatalogoId) => ({
        eixoCatalogoId,
        anotacao: (editAnotacoes[eixoCatalogoId] ?? '').trim() || undefined,
      }))
      return atualizarEstudoCaso(estudoId, { titulo, contextoSituacao, itensEixo })
    },
    onSuccess: (d) => {
      qc.setQueryData(['estudo-caso', estudoId], d)
      qc.invalidateQueries({ queryKey: ['estudos-caso-aluno', d.alunoId] })
      setEditando(false)
      success('Alterações salvas', 'O rascunho anterior foi removido. Gere um novo texto simulado se precisar.')
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const excluirMutation = useMutation({
    mutationFn: () => excluirEstudoCaso(estudoId!),
    onSuccess: () => {
      const aid = detalhe?.alunoId
      if (aid != null) qc.invalidateQueries({ queryKey: ['estudos-caso-aluno', aid] })
      qc.removeQueries({ queryKey: ['estudo-caso', estudoId] })
      success('Estudo excluído', 'O registro foi removido.')
      setExcluirOpen(false)
      handleDialogOpenChange(false)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
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

  async function exportarWord() {
    const texto = detalhe?.textoSimulado?.trim()
    if (!detalhe || !texto) return
    try {
      await downloadEstudoCasoDocx({
        tituloEstudo: detalhe.titulo,
        alunoNome: detalhe.alunoNomeCompleto || 'Aluno(a)',
        textoCompleto: texto,
      })
      success('Documento gerado', 'Arquivo .docx baixado — revise antes de uso oficial.')
    } catch {
      showError('Exportação', 'Não foi possível gerar o arquivo Word.')
    }
  }

  async function exportarPdf() {
    const texto = detalhe?.textoSimulado?.trim()
    if (!detalhe || !texto) return
    try {
      downloadEstudoCasoPdf({
        tituloEstudo: detalhe.titulo,
        alunoNome: detalhe.alunoNomeCompleto || 'Aluno(a)',
        textoCompleto: texto,
      })
      success('PDF gerado', 'Arquivo baixado — revise antes de uso oficial.')
    } catch {
      showError('Exportação PDF', 'Não foi possível gerar o arquivo.')
    }
  }

  const feedbackErro =
    isError && error instanceof Error ? error.message : isError ? 'Não foi possível carregar o estudo de caso.' : null

  const podeSalvarEdicao =
    editTitulo.trim().length > 0 &&
    editContexto.trim().length > 0 &&
    eixosCatalogo.length > 0 &&
    estudoCasoCatalogoEixosCompleto(
      eixosCatalogo.map((e) => e.id),
      editEixoIds
    )

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto gap-3">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar estudo de caso' : detalhe?.titulo ?? 'Estudo de caso'}</DialogTitle>
            <DialogDescription>
              Conteúdo de apoio ao PAEE. Texto automático é marcado como <strong>rascunho simulado</strong> e exige
              revisão.
            </DialogDescription>
          </DialogHeader>

          {detalhe && !editando && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={iniciarEdicao}>
                <PencilSimple size={14} />
                Editar
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => setExcluirOpen(true)}>
                <Trash size={14} weight="bold" />
                Excluir
              </Button>
            </div>
          )}

          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {feedbackErro && <p className="text-sm text-destructive">{feedbackErro}</p>}

          {detalhe && editando && (
            <div className="space-y-4 text-sm border border-border rounded-lg p-4 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Ao salvar, o rascunho simulado atual será <strong>removido</strong> até você gerar outro.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="ec-edit-titulo">
                  Título
                </label>
                <Input
                  id="ec-edit-titulo"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="ec-edit-ctx">
                  Situação / contexto
                </label>
                <textarea
                  id="ec-edit-ctx"
                  rows={5}
                  value={editContexto}
                  onChange={(e) => setEditContexto(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Eixos pedagógicos</p>
                {!loadingEixos && eixosCatalogo.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Obrigatório marcar os <strong>{eixosCatalogo.length}</strong> eixos. Selecionados:{' '}
                    {editEixoIds.filter((id) => eixosCatalogo.some((e) => e.id === id)).length} de {eixosCatalogo.length}
                  </p>
                )}
                {loadingEixos ? (
                  <p className="text-sm text-muted-foreground">Carregando eixos…</p>
                ) : (
                  <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                    {eixosCatalogo.map((eixo) => {
                      const sel = editEixoIds.includes(eixo.id)
                      return (
                        <div
                          key={eixo.id}
                          className={`rounded-lg border p-3 space-y-2 transition-colors ${
                            sel ? 'border-primary bg-primary/5' : 'border-border bg-card'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleEditEixo(eixo.id)}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <span
                              className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center text-xs font-bold ${
                                sel ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40'
                              }`}
                            >
                              {sel ? '✓' : ''}
                            </span>
                            <span className="flex-1">
                              <span className="font-semibold text-foreground block">{eixo.rotulo}</span>
                              {eixo.descricaoHint && (
                                <span className="text-xs text-muted-foreground block mt-1">{eixo.descricaoHint}</span>
                              )}
                            </span>
                          </button>
                          {sel && (
                            <textarea
                              rows={2}
                              value={editAnotacoes[eixo.id] ?? ''}
                              onChange={(ev) => setAnotacaoEixo(eixo.id, ev.target.value)}
                              placeholder="Observação opcional neste eixo…"
                              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ml-8 max-w-[calc(100%-2rem)]"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={cancelarEdicao} disabled={salvarEdicaoMutation.isPending}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => salvarEdicaoMutation.mutate()}
                  loading={salvarEdicaoMutation.isPending}
                  disabled={!podeSalvarEdicao}
                >
                  Salvar alterações
                </Button>
              </div>
            </div>
          )}

          {detalhe && !editando && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contexto / situação</p>
                <p className="text-foreground whitespace-pre-wrap mt-1">{detalhe.contextoSituacao}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Eixos e anotações</p>
                <ul className="mt-2 space-y-2">
                  {detalhe.itensEixo.map((item) => (
                    <li
                      key={`${item.eixoCatalogoId}-${item.codigoEixo}`}
                      className="rounded-lg border border-border bg-muted/40 p-3"
                    >
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Texto simulado (rascunho)
                  </p>
                  <div className="flex flex-wrap gap-2">
                  {detalhe.textoSimulado?.trim() && (
                    <>
                      <Button type="button" size="sm" variant="outline" onClick={exportarPdf}>
                        <FilePdf size={14} />
                        PDF
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={exportarWord}>
                        <DownloadSimple size={14} />
                        Word
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={copiarTexto}>
                        <Copy size={14} />
                        Copiar
                      </Button>
                    </>
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

      <EstudoCasoExcluirDialog
        open={excluirOpen}
        onClose={() => setExcluirOpen(false)}
        titulo={detalhe?.titulo ?? 'este estudo'}
        onConfirm={() => excluirMutation.mutate()}
        isPending={excluirMutation.isPending}
      />
    </>
  )
}
