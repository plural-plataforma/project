import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowClockwise, CheckCircle, Copy, DownloadSimple, FilePdf, LockOpen, Warning } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import {
  buscarRelatorioPorId,
  atualizarSecaoRelatorio,
  finalizarRelatorio,
  reabrirRelatorio,
  duplicarRelatorio,
  gerarNovamenteRelatorio,
} from '@/services/relatorioService'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { downloadRelatorioDocx } from '@/lib/exportRelatorioDocx'
import { downloadRelatorioPdf } from '@/lib/exportRelatorioPdf'
import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_NUMERO,
  RELATORIO_SECAO_ORDEM,
  RELATORIO_STATUS_BADGE_VARIANT,
  RELATORIO_STATUS_LABELS,
  RELATORIO_TIPO_PERIODO_LABELS,
  type RelatorioSecaoChaveCodigo,
} from '@/types/relatorio'

const formatDate = (d: string) => dayjs(d).format('DD/MM/YYYY')

interface SecaoDraft {
  textoEditado: string
  notasManuais: string
}

export default function RelatorioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: showError } = useToast()

  const [drafts, setDrafts] = useState<Record<number, SecaoDraft>>({})

  const { data: relatorio, isLoading } = useQuery({
    queryKey: ['relatorio', id],
    queryFn: () => buscarRelatorioPorId(Number(id)),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 2 ? 5000 : false),
  })

  /* eslint-disable react-hooks/set-state-in-effect --
     Sincroniza rascunhos com o texto vindo da API (gerado por IA ou já editado antes). */
  useEffect(() => {
    if (!relatorio) return
    setDrafts(
      Object.fromEntries(
        relatorio.secoes.map((s) => [
          s.secaoChave,
          {
            textoEditado: s.textoEditado ?? s.textoGerado ?? '',
            notasManuais: s.notasManuais ?? '',
          },
        ])
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
        notasManuais: drafts[secaoChave]?.notasManuais ?? '',
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
  })

  const finalizarMutation = useMutation({
    mutationFn: () => finalizarRelatorio(Number(id)),
    onSuccess: () => {
      success('Relatório finalizado!')
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
            {finalizado ? (
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
                loading={finalizarMutation.isPending}
                disabled={semSecoes}
                onClick={() => finalizarMutation.mutate()}
              >
                <CheckCircle size={14} />
                Finalizar
              </Button>
            )}
          </div>
        }
      />

      {gerando ? (
        <Card>
          <CardContent className="pt-5 flex flex-col items-center gap-3 text-center">
            <span className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              A Plural está gerando este relatório em segundo plano. Você pode sair desta tela —
              avisamos por notificação quando estiver pronto.
            </p>
            <Button
              variant="ghost"
              size="sm"
              loading={gerarNovamenteMutation.isPending}
              onClick={() => gerarNovamenteMutation.mutate()}
            >
              <ArrowClockwise size={14} />
              Está demorando? Tentar novamente
            </Button>
          </CardContent>
        </Card>
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
            <Button
              variant="outline"
              size="sm"
              loading={gerarNovamenteMutation.isPending}
              onClick={() => gerarNovamenteMutation.mutate()}
            >
              <ArrowClockwise size={14} />
              Gerar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {RELATORIO_SECAO_ORDEM.map((chave) => {
            const secao = secoesPorChave.get(chave)
            const draft = drafts[chave] ?? { textoEditado: '', notasManuais: '' }
            const salvando = salvarSecaoMutation.isPending && salvarSecaoMutation.variables === chave

            return (
              <Card key={chave}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">
                    {RELATORIO_SECAO_NUMERO[chave]}. {RELATORIO_SECAO_LABELS[chave]}
                  </CardTitle>
                  {secao?.informacaoInsuficiente && <Badge variant="muted">Informação insuficiente</Badge>}
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Notas manuais (opcional)</label>
                    <textarea
                      rows={2}
                      value={draft.notasManuais}
                      disabled={finalizado}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [chave]: { ...prev[chave], notasManuais: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />
                  </div>
                  {!finalizado && (
                    <div className="flex justify-end">
                      <Button size="sm" loading={salvando} onClick={() => salvarSecaoMutation.mutate(chave)}>
                        Salvar seção
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
    </motion.div>
  )
}
