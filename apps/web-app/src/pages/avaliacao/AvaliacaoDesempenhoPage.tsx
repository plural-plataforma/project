import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FloppyDisk, LightbulbFilament, CheckCircle } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { InlineLoader } from '@/components/common/LoadingScreen'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HistoryTimelinePanel, type HistoryTimelineEntry } from '@/components/lists'
import { buscarAvaliacaoPorId, buscarHistoricoDesempenho, finalizarAvaliacao, registrarDesempenhoBatch } from '@/services/avaliacaoDiagnosticaService'
import { buscarHabilidades } from '@/services/habilidadeService'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import type { NivelRealizacao, RegistrarDesempenhoBatchRequest } from '@/types/avaliacao-diagnostica'

const NIVEL_OPTIONS: Array<{ value: NivelRealizacao; label: string }> = [
  { value: 'Autonomia', label: 'Autonomia' },
  { value: 'ComAjuda', label: 'Com ajuda' },
  { value: 'NaoRealizou', label: 'Não realizou' },
]

const NIVEL_BADGE: Record<
  string,
  HistoryTimelineEntry['badge']
> = {
  Autonomia: { label: 'Autonomia', variant: 'success' },
  ComAjuda: { label: 'Com ajuda', variant: 'amber' },
  NaoRealizou: { label: 'Não realizou', variant: 'danger' },
}

const keyFor = (alunoId: number, atividadeId: number): string => `${alunoId}:${atividadeId}`

export default function AvaliacaoDesempenhoPage() {
  const { avaliacaoId: avaliacaoIdParam } = useParams<{ avaliacaoId: string }>()
  const navigate = useNavigate()
  const avaliacaoId = Number(avaliacaoIdParam)
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [nivelMap, setNivelMap] = useState<Record<string, NivelRealizacao>>({})
  const [obsAlunoMap, setObsAlunoMap] = useState<Record<number, string>>({})

  const { data: avaliacao, isLoading, isFetching: isRefreshingAvaliacao, refetch: refetchAvaliacao } = useQuery({
    queryKey: ['avaliacao-detalhada', avaliacaoId],
    queryFn: () => buscarAvaliacaoPorId(avaliacaoId),
    enabled: Number.isFinite(avaliacaoId) && avaliacaoId > 0,
  })

  const { data: historico, isLoading: isLoadingHistorico, isFetching: isRefreshingHistorico, refetch: refetchHistorico } = useQuery({
    queryKey: ['avaliacao-desempenho-historico', avaliacaoId],
    queryFn: () => buscarHistoricoDesempenho(avaliacaoId),
    enabled: Number.isFinite(avaliacaoId) && avaliacaoId > 0,
  })

  const isRefreshingDesempenho = isRefreshingAvaliacao || isRefreshingHistorico

  const { data: habilidades = [] } = useQuery({
    queryKey: ['habilidades'],
    queryFn: buscarHabilidades,
    enabled: Number.isFinite(avaliacaoId) && avaliacaoId > 0,
  })

  const labelPorHabilidadeId = useMemo(() => {
    const m = new Map<number, string>()
    for (const h of habilidades) {
      const partes = [h.tipo, h.resumo || h.descricao].filter(Boolean) as string[]
      m.set(h.id, partes.length > 0 ? partes.join(' — ') : `Habilidade #${h.id}`)
    }
    return m
  }, [habilidades])

  const perfisComResultado = useMemo(() => {
    const lista = avaliacao?.perfisAutonomiaPorAluno ?? []
    return [...lista]
      .filter((p) => p.nivelPerfilAutonomia !== 'NaoAvaliado')
      .sort((a, b) =>
        (a.nomeCompleto || '').localeCompare(b.nomeCompleto || '', 'pt-BR', { sensitivity: 'base' })
      )
  }, [avaliacao?.perfisAutonomiaPorAluno])

  const temLancamentosSalvos = useMemo(
    () => (avaliacao?.registrosDesempenho?.length ?? 0) > 0,
    [avaliacao?.registrosDesempenho]
  )

  useEffect(() => {
    if (!avaliacao) return

    const initialNivelMap: Record<string, NivelRealizacao> = {}
    const initialObsAlunoMap: Record<number, string> = {}

    for (const registro of avaliacao.registrosDesempenho ?? []) {
      if (!registro.atividadeId) continue
      const key = keyFor(registro.alunoId, registro.atividadeId)
      initialNivelMap[key] = registro.nivelRealizacao as NivelRealizacao
    }

    for (const obsAluno of avaliacao.observacoesAlunos ?? []) {
      initialObsAlunoMap[obsAluno.alunoId] = obsAluno.observacao ?? ''
    }

    setNivelMap(initialNivelMap)
    setObsAlunoMap(initialObsAlunoMap)
  }, [avaliacao])

  const alunos = useMemo(
    () =>
      (avaliacao?.alunosParticipantes ?? []).map((p) => ({
        id: p.alunoId,
        nome: p.aluno?.nomeCompleto ?? `Aluno #${p.alunoId}`,
      })),
    [avaliacao]
  )

  const atividades = useMemo(() => {
    const blocos = avaliacao?.blocosComAtividades ?? []
    return blocos
      .sort((a, b) => a.ordem - b.ordem)
      .flatMap((bloco) =>
        bloco.atividades.map((atividade) => ({
          atividadeId: atividade.id,
          atividadeTitulo: atividade.titulo,
          habilidadeIds: atividade.habilidadeIds ?? [],
        }))
      )
  }, [avaliacao])

  const historicoEntries = useMemo((): HistoryTimelineEntry[] => {
    const alunoPorId = new Map(alunos.map((a) => [a.id, a.nome]))
    const atividadePorId = new Map(atividades.map((a) => [a.atividadeId, a.atividadeTitulo]))
    const entries: HistoryTimelineEntry[] = []

    for (const item of historico?.itens ?? []) {
      entries.push({
        id: `item-${item.id}`,
        kind: 'activity',
        occurredAt: item.dataRegistro,
        primary: alunoPorId.get(item.alunoId) ?? `Aluno #${item.alunoId}`,
        secondary: atividadePorId.get(item.atividadeId) ?? `Atividade #${item.atividadeId}`,
        badge:
          NIVEL_BADGE[item.nivelRealizacao] ?? {
            label: item.nivelRealizacao,
            variant: 'muted',
          },
      })
    }

    for (const obs of historico?.observacoesAlunos ?? []) {
      entries.push({
        id: `obs-${obs.id}`,
        kind: 'observation',
        occurredAt: obs.dataRegistro,
        primary: alunoPorId.get(obs.alunoId) ?? `Aluno #${obs.alunoId}`,
        detail: obs.observacao,
        badge: { label: 'Observação geral', variant: 'purple' },
      })
    }

    return entries.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
  }, [historico, alunos, atividades])

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const itens: RegistrarDesempenhoBatchRequest['itens'] = []
      const observacoesAlunos: RegistrarDesempenhoBatchRequest['observacoesAlunos'] = []

      for (const aluno of alunos) {
        for (const atividade of atividades) {
          const key = keyFor(aluno.id, atividade.atividadeId)
          const nivel = nivelMap[key]
          if (!nivel) continue

          itens.push({
            alunoId: aluno.id,
            atividadeId: atividade.atividadeId,
            nivelRealizacao: nivel,
          })
        }

        const obsAluno = obsAlunoMap[aluno.id]?.trim()
        if (obsAluno) {
          observacoesAlunos?.push({
            alunoId: aluno.id,
            observacao: obsAluno,
          })
        }
      }

      if (itens.length === 0 && (observacoesAlunos?.length ?? 0) === 0) {
        throw new Error('Preencha pelo menos um lançamento ou observação para salvar.')
      }

      return registrarDesempenhoBatch({
        avaliacaoDiagnosticaId: avaliacaoId,
        itens,
        observacoesAlunos,
      })
    },
    onSuccess: async () => {
      success('Desempenho salvo', 'Perfil e sugestões PAEE atualizados.')
      await Promise.all([refetchAvaliacao(), refetchHistorico()])
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-diagnosticas'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      error('Falha ao salvar desempenho', formatFriendlyErrorBody(fb))
    },
  })

  const finalizarMutation = useMutation({
    mutationFn: () => finalizarAvaliacao(avaliacaoId),
    onSuccess: (data) => {
      success('Avaliação finalizada', data.mensagem)
      queryClient.invalidateQueries({ queryKey: ['avaliacao-detalhada', avaliacaoId] })
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-diagnosticas'] })
      navigate('/avaliacoes')
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      error('Falha ao finalizar', formatFriendlyErrorBody(fb))
    },
  })

  if (!Number.isFinite(avaliacaoId) || avaliacaoId <= 0) {
    return <p className="text-muted-foreground">Avaliação inválida.</p>
  }

  if (isLoading) {
    return <InlineLoader message="Carregando avaliação..." />
  }

  if (!avaliacao) {
    return <p className="text-muted-foreground">Avaliação não encontrada.</p>
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lançamento de desempenho"
        description={`${avaliacao.titulo}${avaliacao.concluida ? ' (concluída)' : ''}`}
        backTo="/avaliacoes"
        action={(
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => salvarMutation.mutate()}
              loading={salvarMutation.isPending}
              disabled={finalizarMutation.isPending}
            >
              <FloppyDisk size={16} />
              Salvar lançamentos
            </Button>
            <Button
              type="button"
              onClick={() => finalizarMutation.mutate()}
              loading={finalizarMutation.isPending}
              disabled={avaliacao.concluida || salvarMutation.isPending}
            >
              <CheckCircle size={16} weight="bold" />
              Finalizar avaliação
            </Button>
          </div>
        )}
      />

      <p className="text-sm text-muted-foreground">
        {temLancamentosSalvos
          ? 'Você pode continuar lançando e editando desempenho mesmo após concluir a avaliação.'
          : 'Aplique as atividades com o aluno (use o PDF ou Word da avaliação) e depois registre aqui o que ele conseguiu em cada atividade.'}
      </p>

      {(perfisComResultado.length > 0 || (isRefreshingDesempenho && temLancamentosSalvos)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Perfil de autonomia e sugestões PAEE
              {isRefreshingDesempenho && (
                <span className="text-xs font-normal text-muted-foreground">Atualizando…</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visão em níveis discretos (Autonomia, Com ajuda, Não realizou) calculada a partir dos lançamentos por atividade.
              Atualiza quando você salva.
            </p>
            <div className="space-y-3">
              {perfisComResultado.map((p) => (
                  <div
                    key={p.alunoId}
                    className="rounded-lg border border-border bg-muted/35 px-3 py-3 space-y-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.nomeCompleto}</p>
                    </div>
                    <p className="text-sm text-foreground leading-snug">{p.rotuloExibicao}</p>
                    <p className="text-xs text-muted-foreground flex gap-2 leading-snug">
                      <LightbulbFilament size={16} className="shrink-0 text-amber-600 mt-0.5" aria-hidden />
                      <span>{p.sugestaoPaee}</span>
                    </p>
                    {p.habilidadesAReenforcar?.trim() && (
                      <p className="text-xs text-foreground leading-snug">
                        <span className="font-semibold">Habilidades a reforçar: </span>
                        {p.habilidadesAReenforcar}
                      </p>
                    )}
                    {p.habilidadesFortes?.trim() && (
                      <p className="text-xs text-muted-foreground leading-snug">
                        <span className="font-semibold text-foreground/80">Habilidades fortes: </span>
                        {p.habilidadesFortes}
                      </p>
                    )}
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {alunos.length === 0 || atividades.length === 0 ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">
              Esta avaliação não possui alunos ou atividades para lançamento.
            </p>
          </CardContent>
        </Card>
      ) : (
        alunos.map((aluno) => (
          <Card key={aluno.id}>
            <CardHeader>
              <CardTitle>{aluno.nome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Observação geral do aluno</label>
                <textarea
                  rows={2}
                  value={obsAlunoMap[aluno.id] ?? ''}
                  onChange={(e) => setObsAlunoMap((prev) => ({ ...prev, [aluno.id]: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Observação geral sobre o desempenho deste aluno nesta avaliação..."
                />
              </div>

              <div className="space-y-3">
                {atividades.map((atividade) => {
                  const key = keyFor(aluno.id, atividade.atividadeId)
                  const habilidadesTexto =
                    atividade.habilidadeIds.length > 0
                      ? atividade.habilidadeIds
                          .map((id) => labelPorHabilidadeId.get(id) ?? `#${id}`)
                          .join(' · ')
                      : null
                  return (
                    <div key={key} className="rounded-lg border border-border p-3 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{atividade.atividadeTitulo}</p>
                        {habilidadesTexto && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-semibold text-foreground/80">Habilidade: </span>
                            {habilidadesTexto}
                          </p>
                        )}
                      </div>
                      <Select
                        value={nivelMap[key] ?? ''}
                        onValueChange={(value) => {
                          setNivelMap((prev) => ({ ...prev, [key]: value as NivelRealizacao }))
                        }}
                      >
                        <SelectTrigger className="w-full md:max-w-xs">
                          <SelectValue placeholder="Selecione o nível de realização" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIVEL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <HistoryTimelinePanel
        title="Histórico de lançamentos"
        entries={historicoEntries}
        isLoading={isLoadingHistorico}
        isRefreshing={isRefreshingHistorico}
        maxItems={30}
        emptyMessage="Ainda não há histórico para esta avaliação."
      />
    </div>
  )
}
