import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClockCounterClockwise, FloppyDisk } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buscarAvaliacaoPorId, buscarHistoricoDesempenho, registrarDesempenhoBatch } from '@/services/avaliacaoDiagnosticaService'
import { buscarHabilidades } from '@/services/habilidadeService'
import { useToast } from '@/hooks/useToast'
import type { NivelRealizacao, RegistrarDesempenhoBatchRequest } from '@/types/avaliacao-diagnostica'

const NIVEL_OPTIONS: Array<{ value: NivelRealizacao; label: string }> = [
  { value: 'Autonomia', label: 'Autonomia' },
  { value: 'ComAjuda', label: 'Com ajuda' },
  { value: 'NaoRealizou', label: 'Não realizou' },
]

const keyFor = (alunoId: number, atividadeId: number): string => `${alunoId}:${atividadeId}`

export default function AvaliacaoDesempenhoPage() {
  const { avaliacaoId: avaliacaoIdParam } = useParams<{ avaliacaoId: string }>()
  const navigate = useNavigate()
  const avaliacaoId = Number(avaliacaoIdParam)
  const queryClient = useQueryClient()
  const { success, error } = useToast()

  const [nivelMap, setNivelMap] = useState<Record<string, NivelRealizacao>>({})
  const [obsAlunoMap, setObsAlunoMap] = useState<Record<number, string>>({})

  const { data: avaliacao, isLoading } = useQuery({
    queryKey: ['avaliacao-detalhada', avaliacaoId],
    queryFn: () => buscarAvaliacaoPorId(avaliacaoId),
    enabled: Number.isFinite(avaliacaoId) && avaliacaoId > 0,
  })

  const { data: historico } = useQuery({
    queryKey: ['avaliacao-desempenho-historico', avaliacaoId],
    queryFn: () => buscarHistoricoDesempenho(avaliacaoId),
    enabled: Number.isFinite(avaliacaoId) && avaliacaoId > 0,
  })

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
    onSuccess: () => {
      success('Desempenho salvo', 'Novo evento histórico registrado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['avaliacao-detalhada', avaliacaoId] })
      queryClient.invalidateQueries({ queryKey: ['avaliacao-desempenho-historico', avaliacaoId] })
      queryClient.invalidateQueries({ queryKey: ['avaliacao-detalhada'] })
      navigate('/avaliacoes')
    },
    onError: (err: Error) => {
      error('Falha ao salvar desempenho', err.message)
    },
  })

  if (!Number.isFinite(avaliacaoId) || avaliacaoId <= 0) {
    return <p className="text-muted-foreground">Avaliação inválida.</p>
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando avaliação...</p>
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
          <Button
            onClick={() => salvarMutation.mutate()}
            loading={salvarMutation.isPending}
          >
            <FloppyDisk size={16} />
            Salvar lançamentos
          </Button>
        )}
      />

      <p className="text-sm text-muted-foreground">
        Você pode continuar lançando e editando desempenho mesmo após concluir a avaliação.
      </p>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockCounterClockwise size={18} />
            Histórico de lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(historico?.itens?.length ?? 0) === 0 && (historico?.observacoesAlunos?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há histórico para esta avaliação.</p>
          ) : (
            <>
              {historico?.itens.slice(0, 20).map((item) => (
                <div key={`hist-item-${item.id}`} className="text-sm text-foreground rounded-md bg-muted p-2">
                  Aluno {item.alunoId} • Atividade {item.atividadeId} • {item.nivelRealizacao} •{' '}
                  {new Date(item.dataRegistro).toLocaleString('pt-BR')}
                </div>
              ))}
              {historico?.observacoesAlunos.slice(0, 10).map((item) => (
                <div key={`hist-obs-${item.id}`} className="text-sm text-foreground rounded-md bg-muted p-2">
                  Obs. geral aluno {item.alunoId} • {new Date(item.dataRegistro).toLocaleString('pt-BR')} •{' '}
                  {item.observacao}
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
