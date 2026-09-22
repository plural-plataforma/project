import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowClockwise, CheckCircle, Copy, DownloadSimple, FilePdf, LockOpen, Warning, WarningCircle } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import {
  buscarRelatorioPorId,
  atualizarSecaoRelatorio,
  finalizarRelatorio,
  aceitarRevisaoFinal,
  descartarRevisaoFinal,
  reabrirRelatorio,
  duplicarRelatorio,
  gerarNovamenteRelatorio,
} from '@/services/relatorioService'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { LIMITE_USO_IA_QUERY_KEY, useLimiteUsoIA } from '@/hooks/useLimiteUsoIA'
import { AvisoLimiteUsoIA } from '@/components/common/AvisoLimiteUsoIA'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { downloadRelatorioDocx } from '@/lib/exportRelatorioDocx'
import { downloadRelatorioPdf } from '@/lib/exportRelatorioPdf'
import { RelatorioRevisaoFinal } from './RelatorioRevisaoFinal'
import {
  RELATORIO_FORMATO_FINAL_LABELS,
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_NUMERO,
  RELATORIO_SECAO_ORDEM,
  RELATORIO_STATUS_BADGE_VARIANT,
  RELATORIO_STATUS_LABELS,
  RELATORIO_TIPO_PERIODO_LABELS,
  type RelatorioFormatoFinalCodigo,
  type RelatorioSecao,
  type RelatorioSecaoChaveCodigo,
} from '@/types/relatorio'

const RELATORIO_FORMATO_FINAL_OPCOES: RelatorioFormatoFinalCodigo[] = [0, 1]

const RELATORIO_FORMATO_FINAL_AJUDA: Record<RelatorioFormatoFinalCodigo, string> = {
  0: 'Mantém as seções separadas, cada uma com seu título.',
  1: 'Une todas as seções num texto único, sem títulos.',
}

const formatDate = (d: string) => dayjs(d).format('DD/MM/YYYY')
const formatDateTime = (d: string) => dayjs(d).format('DD/MM/YYYY [às] HH:mm')
const formatShortDateTime = (d: string) => dayjs(d).format('DD/MM HH:mm')

interface SecaoDraft {
  textoEditado: string
}

/**
 * Mesma normalização usada para montar o rascunho — permite comparar o que está na tela com o
 * que está gravado. Prioriza `textoRevisado` (mesma ordem de precedência da exportação, ver
 * `montarSecoesRelatorioParaExport`) pra não mostrar na tela um texto pré-revisão enquanto o
 * documento baixado já sai revisado. É seguro em todo estado porque `textoRevisado` só existe
 * em RevisaoFinal/Finalizado (limpo em Descartar/Reabrir/Falhar) — e nesses dois estados o
 * textarea desta seção fica sem o botão de salvar (RevisaoFinal renderiza outro componente;
 * Finalizado desabilita o campo), então a mudança na baseline do "rascunho" não afeta a edição.
 */
function secaoPersistida(secao: RelatorioSecao | undefined): SecaoDraft {
  return { textoEditado: secao?.textoRevisado ?? secao?.textoEditado ?? secao?.textoGerado ?? '' }
}

function temAlteracaoPendente(secao: RelatorioSecao | undefined, draft: SecaoDraft): boolean {
  return secaoPersistida(secao).textoEditado !== draft.textoEditado
}

export default function RelatorioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { limiteDiarioAtingido } = useLimiteUsoIA()
  const { success, error: showError } = useToast()

  const [drafts, setDrafts] = useState<Record<number, SecaoDraft>>({})
  const [formatoDialogAberto, setFormatoDialogAberto] = useState(false)
  const [formatoEscolhido, setFormatoEscolhido] = useState<RelatorioFormatoFinalCodigo>(0)

  const { data: relatorio, isLoading } = useQuery({
    queryKey: ['relatorio', id],
    queryFn: () => buscarRelatorioPorId(Number(id)),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 2 || query.state.data?.status === 4 ? 5000 : false),
  })

  /* eslint-disable react-hooks/set-state-in-effect --
     Sincroniza rascunhos com o texto vindo da API (gerado por IA ou já editado antes). */
  useEffect(() => {
    if (!relatorio) return
    setDrafts(
      Object.fromEntries(
        relatorio.secoes.map((s) => [s.secaoChave, secaoPersistida(s)])
      )
    )
  }, [relatorio])
  /* eslint-enable react-hooks/set-state-in-effect */

  const invalidate = () => qc.invalidateQueries({ queryKey: ['relatorio', id] })

  const salvarSecaoMutation = useMutation({
    mutationFn: (secaoChave: RelatorioSecaoChaveCodigo) =>
      atualizarSecaoRelatorio(Number(id), {
        secaoChave,
        textoEditado: drafts[secaoChave]?.textoEditado ?? '',
      }),
    onSuccess: () => {
      success('Seção salva!')
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const gerarNovamenteMutation = useMutation({
    mutationFn: () => gerarNovamenteRelatorio(Number(id)),
    onSuccess: (resultado) => {
      if (resultado.sucesso) {
        success('Relatório em geração', 'Você será avisado por notificação quando estiver pronto.')
      } else {
        showError('Geração com pendência', resultado.mensagem)
      }
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: LIMITE_USO_IA_QUERY_KEY }),
  })

  const finalizarMutation = useMutation({
    mutationFn: (formato: RelatorioFormatoFinalCodigo) => finalizarRelatorio(Number(id), formato),
    onSuccess: (resultado) => {
      if (resultado.status === 4) {
        success('Revisão em andamento', 'A Plural está revisando o texto que você editou — aguarde nesta tela ou volte depois para decidir.')
      } else {
        success('Relatório finalizado!')
      }
      setFormatoDialogAberto(false)
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: LIMITE_USO_IA_QUERY_KEY }),
  })

  const aceitarRevisaoFinalMutation = useMutation({
    mutationFn: () => aceitarRevisaoFinal(Number(id)),
    onSuccess: () => {
      success('Relatório finalizado!')
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const descartarRevisaoFinalMutation = useMutation({
    mutationFn: () => descartarRevisaoFinal(Number(id)),
    onSuccess: () => {
      success('Revisão descartada — o relatório voltou pra edição.')
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const reabrirMutation = useMutation({
    mutationFn: () => reabrirRelatorio(Number(id)),
    onSuccess: () => {
      success('Relatório reaberto para edição.')
      invalidate()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const duplicarMutation = useMutation({
    mutationFn: () => duplicarRelatorio(Number(id)),
    onSuccess: (novoRelatorio) => {
      success('Relatório duplicado', 'Base criada pro próximo período — gere as seções quando quiser.')
      navigate(`/relatorios/${novoRelatorio.id}`)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  if (isLoading) return <SkeletonList count={4} />
  if (!relatorio) return <p className="text-muted-foreground">Relatório não encontrado.</p>

  const finalizado = relatorio.status === 1
  const gerando = relatorio.status === 2
  const erroGeracao = relatorio.status === 3
  const revisando = relatorio.status === 4
  const secoesPorChave = new Map(relatorio.secoes.map((s) => [s.secaoChave, s]))
  const semSecoes = relatorio.secoes.length === 0

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title={`Relatório Pedagógico — ${relatorio.alunoNome}`}
        description={`${RELATORIO_TIPO_PERIODO_LABELS[relatorio.tipoPeriodo]} · ${formatDate(relatorio.dataInicio)} → ${formatDate(relatorio.dataFim)}`}
        backTo={`/alunos/${relatorio.alunoId}`}
        action={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Badge variant={RELATORIO_STATUS_BADGE_VARIANT[relatorio.status]}>{RELATORIO_STATUS_LABELS[relatorio.status]}</Badge>
            {finalizado && (
              <>
                <Button variant="outline" size="sm" onClick={() => downloadRelatorioPdf(relatorio)}>
                  <FilePdf size={14} />
                  Baixar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadRelatorioDocx(relatorio)}>
                  <DownloadSimple size={14} />
                  Baixar Word
                </Button>
              </>
            )}
            {!revisando && (
              <Button
                variant="outline"
                size="sm"
                loading={duplicarMutation.isPending}
                onClick={() => {
                  if (window.confirm('Duplicar este relatório como base pro próximo período? Cria um novo rascunho pro mesmo aluno, sem texto — a geração é feita do zero.')) {
                    duplicarMutation.mutate()
                  }
                }}
              >
                <Copy size={14} />
                Duplicar
              </Button>
            )}
            {!revisando &&
              (finalizado ? (
                <Button
                  variant="outline"
                  size="sm"
                  loading={reabrirMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Reabrir este relatório para edição? Ele deixa de valer como versão final até ser finalizado novamente.')) {
                      reabrirMutation.mutate()
                    }
                  }}
                >
                  <LockOpen size={14} />
                  Reabrir para edição
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={semSecoes}
                  onClick={() => setFormatoDialogAberto(true)}
                >
                  <CheckCircle size={14} />
                  Finalizar
                </Button>
              ))}
          </div>
        }
      />

      {gerando || (revisando && !relatorio.textoFinalGeradoEm) ? (
        <Card>
          <CardContent className="pt-5 flex flex-col items-center gap-3 text-center">
            <span className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              {revisando
                ? 'A Plural está revisando o texto do relatório.'
                : 'A Plural está gerando este relatório em segundo plano. Você pode sair desta tela — avisamos por notificação quando estiver pronto.'}
            </p>
            {revisando ? (
              <Button
                variant="outline"
                size="sm"
                loading={descartarRevisaoFinalMutation.isPending}
                onClick={() => {
                  if (window.confirm('Cancelar a revisão da IA? O relatório volta para edição — nada se perde, dá pra finalizar de novo quando quiser.')) {
                    descartarRevisaoFinalMutation.mutate()
                  }
                }}
              >
                Cancelar revisão
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={limiteDiarioAtingido}
                loading={gerarNovamenteMutation.isPending}
                onClick={() => gerarNovamenteMutation.mutate()}
              >
                <ArrowClockwise size={14} />
                Está demorando? Tentar novamente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : revisando && relatorio.textoFinalGeradoEm ? (
        <RelatorioRevisaoFinal
          relatorio={relatorio}
          aceitando={aceitarRevisaoFinalMutation.isPending}
          descartando={descartarRevisaoFinalMutation.isPending}
          onAceitar={() => aceitarRevisaoFinalMutation.mutate()}
          onDescartar={() => descartarRevisaoFinalMutation.mutate()}
        />
      ) : semSecoes ? (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-danger">
              <Warning size={18} />
              <p className="text-sm font-semibold">
                {erroGeracao
                  ? 'A geração por IA deste relatório falhou.'
                  : 'A geração por IA ainda não foi concluída para este relatório.'}
              </p>
            </div>
            <AvisoLimiteUsoIA className="mb-0" />
            <Button
              variant="outline"
              size="sm"
              disabled={limiteDiarioAtingido}
              loading={gerarNovamenteMutation.isPending}
              onClick={() => gerarNovamenteMutation.mutate()}
            >
              <ArrowClockwise size={14} />
              Gerar novamente
            </Button>
          </CardContent>
        </Card>
      ) : finalizado && relatorio.formatoFinal === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Texto final</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">{relatorio.textoFinal}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {RELATORIO_SECAO_ORDEM.map((chave) => {
            const secao = secoesPorChave.get(chave)
            const draft = drafts[chave] ?? { textoEditado: '' }
            const salvando = salvarSecaoMutation.isPending && salvarSecaoMutation.variables === chave
            const alteracaoPendente = temAlteracaoPendente(secao, draft)

            return (
              <Card key={chave}>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">
                    {RELATORIO_SECAO_NUMERO[chave]}. {RELATORIO_SECAO_LABELS[chave]}
                  </CardTitle>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {secao?.informacaoInsuficiente && <Badge variant="muted">Informação insuficiente</Badge>}
                    {alteracaoPendente ? (
                      <Badge variant="amber">
                        <WarningCircle size={12} weight="fill" />
                        Alterações não salvas
                      </Badge>
                    ) : secao?.editadoEm ? (
                      <Badge variant="success" title={`Última edição salva em ${formatDateTime(secao.editadoEm)}`}>
                        <CheckCircle size={12} weight="fill" />
                        Salvo {formatShortDateTime(secao.editadoEm)}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Texto</label>
                    <textarea
                      rows={5}
                      value={draft.textoEditado}
                      disabled={finalizado}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [chave]: { ...prev[chave], textoEditado: e.target.value },
                        }))
                      }
                      placeholder={
                        secao?.informacaoInsuficiente
                          ? 'Sem dado suficiente na plataforma — preencha manualmente.'
                          : undefined
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />
                  </div>
                  {!finalizado && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        loading={salvando}
                        disabled={!alteracaoPendente}
                        onClick={() => salvarSecaoMutation.mutate(chave)}
                      >
                        {alteracaoPendente ? 'Salvar seção' : 'Seção salva'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/alunos/${relatorio.alunoId}`)}>
          Voltar para o aluno
        </Button>
      </div>

      <Dialog open={formatoDialogAberto} onOpenChange={setFormatoDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como você quer o documento final?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {RELATORIO_FORMATO_FINAL_OPCOES.map((formato) => (
              <div key={formato} className="space-y-1.5">
                <Button
                  type="button"
                  className="w-full"
                  variant={formatoEscolhido === formato ? 'default' : 'outline'}
                  onClick={() => setFormatoEscolhido(formato)}
                >
                  {RELATORIO_FORMATO_FINAL_LABELS[formato]}
                </Button>
                <p className="text-xs text-muted-foreground">{RELATORIO_FORMATO_FINAL_AJUDA[formato]}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              loading={finalizarMutation.isPending}
              onClick={() => finalizarMutation.mutate(formatoEscolhido)}
            >
              Gerar versão final
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
