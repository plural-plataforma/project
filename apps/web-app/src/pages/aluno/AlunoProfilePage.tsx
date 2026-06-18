import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  PencilSimple,
  GraduationCap,
  Phone,
  Envelope,
  User,
  ArrowSquareOut,
  Trash,
  CalendarBlank,
  Clock,
  Article,
  Lightning,
} from '@phosphor-icons/react'
import { buscarAlunoPorId, excluirAluno } from '@/services/alunoService'
import { buscarEscolasProfessor } from '@/services/professorService'
import { buscarAvaliacaoPorId, buscarAvaliacoesDiagnosticas } from '@/services/avaliacaoDiagnosticaService'
import { buscarEstudoCasoPorId, listarEstudosCasoPorAluno } from '@/services/estudoCasoService'
import {
  criarPaeeAPartirDoEstudoDeCaso,
  estudoCasoEstaConcluidoAsync,
} from '@/lib/criarPaeeAPartirDoEstudoDeCaso'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { DownloadFormatMenu } from '@/components/lists'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EstudoCasoDetalheDialog } from '@/pages/estudo-caso/EstudoCasoDetalheDialog'
import { AlunoFormDialog } from './AlunoFormDialog'
import { AlunoExcluirDialog } from './AlunoExcluirDialog'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { labelTipoAtendimentoAee } from '@/types/aluno'
import { baixarEstudoCasoPdf, baixarEstudoCasoWord } from '@/lib/baixarEstudoCaso'
import { baixarPlanejamentoPdf, baixarPlanejamentoWord } from '@/lib/baixarPlanejamento'
import { baixarAvaliacaoDiagnosticaPdf, baixarAvaliacaoDiagnosticaWord } from '@/lib/baixarAvaliacaoDiagnostica'

export default function AlunoProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [estudoCasoDetalheId, setEstudoCasoDetalheId] = useState<number | null>(null)
  const [gerandoPaeeEstudoId, setGerandoPaeeEstudoId] = useState<number | null>(null)

  const { data: aluno, isLoading } = useQuery({
    queryKey: ['aluno', id],
    queryFn: () => buscarAlunoPorId(Number(id)),
    enabled: !!id,
  })

  const { data: escolas = [] } = useQuery({
    queryKey: ['escolas-professor'],
    queryFn: buscarEscolasProfessor,
  })
  const { data: avaliacoesDiagnosticasResumo = [], isLoading: loadingAvaliacoesDiagnosticas } = useQuery({
    queryKey: ['avaliacoes-diagnosticas'],
    queryFn: buscarAvaliacoesDiagnosticas,
  })
  const { data: avaliacoesDiagnosticasDetalhes = [] } = useQuery({
    queryKey: ['avaliacoes-diagnosticas-detalhes-perfil-aluno', avaliacoesDiagnosticasResumo.map((av) => av.id).join('-')],
    enabled: avaliacoesDiagnosticasResumo.length > 0,
    queryFn: async () => Promise.all(
      avaliacoesDiagnosticasResumo.map((av) => buscarAvaliacaoPorId(av.id))
    ),
  })

  const { data: estudosCaso = [], isLoading: loadingEstudosCaso } = useQuery({
    queryKey: ['estudos-caso-aluno', aluno?.id],
    queryFn: () => listarEstudosCasoPorAluno(aluno!.id!),
    enabled: !!aluno?.id,
  })

  const gerarPaeeMutation = useMutation({
    mutationFn: async (estudoId: number) => {
      setGerandoPaeeEstudoId(estudoId)
      const detalhe = await buscarEstudoCasoPorId(estudoId)
      const concluido = await estudoCasoEstaConcluidoAsync(detalhe)
      if (!concluido) throw new Error('Conclua o estudo de caso antes de gerar o PAEE.')
      return criarPaeeAPartirDoEstudoDeCaso({ estudo: detalhe })
    },
    onSuccess: (plano) => {
      success('PAEE criado', 'Revise objetivos, encontros e assinatura no detalhe do plano.')
      void qc.invalidateQueries({ queryKey: ['planejamentos'] })
      void qc.invalidateQueries({ queryKey: ['aluno', id] })
      setGerandoPaeeEstudoId(null)
      navigate(`/planejamentos/${plano.id}`)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
      setGerandoPaeeEstudoId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (studentId: number) => excluirAluno(studentId),
    onSuccess: () => {
      success('Aluno excluído', 'O cadastro foi removido.')
      setDeleteOpen(false)
      qc.invalidateQueries({ queryKey: ['alunos'] })
      navigate('/alunos', { replace: true })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError('Não foi possível excluir', formatFriendlyErrorBody(fb))
    },
  })

  if (isLoading) return <SkeletonList count={3} />
  if (!aluno) return <p className="text-muted-foreground">Aluno não encontrado.</p>
  const alunoId = aluno.id ?? 0
  const alunoNome = aluno.nomeCompleto

  const initials = aluno.nomeCompleto
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const escola = escolas.find((e) => e.id === aluno.idEscola)

  const infoItems = [
    aluno.dataNascimento && {
      icon: CalendarBlank,
      label: 'Data de nascimento',
      value: new Date(`${aluno.dataNascimento}T12:00:00`).toLocaleDateString('pt-BR'),
    },
    aluno.sexo && { icon: User, label: 'Sexo', value: ({ M: 'Masculino', F: 'Feminino', O: 'Outro' } as Record<string, string>)[aluno.sexo] ?? aluno.sexo },
    aluno.nivelEnsino && { icon: GraduationCap, label: 'Nível de ensino', value: aluno.nivelEnsino },
    aluno.turno && { icon: GraduationCap, label: 'Turno', value: aluno.turno },
    aluno.ano && { icon: GraduationCap, label: 'Ano/Série', value: aluno.ano },
  ].filter(Boolean) as Array<{ icon: React.ElementType; label: string; value: string }>

  const temAtendimentoAee =
    aluno.frequenciaSemanalAtendimento != null ||
    (aluno.diasSemanaAtendimento?.length ?? 0) > 0 ||
    aluno.duracaoAtendimentoMinutos != null ||
    aluno.tipoAtendimentoAee != null

  const tipoAtendimentoLabel = labelTipoAtendimentoAee(aluno.tipoAtendimentoAee)

  async function baixarEstudoPdf(estudoId: number) {
    try {
      await baixarEstudoCasoPdf(estudoId)
      success('PDF gerado', 'Arquivo baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  async function baixarEstudoWord(estudoId: number) {
    try {
      await baixarEstudoCasoWord(estudoId)
      success('Word gerado', 'Arquivo .docx baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  async function baixarPaeePdf(planejamentoId: number) {
    try {
      await baixarPlanejamentoPdf(planejamentoId)
      success('PDF gerado', 'Arquivo baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  async function baixarPaeeWord(planejamentoId: number) {
    try {
      await baixarPlanejamentoWord(planejamentoId)
      success('Word gerado', 'Arquivo .docx baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  async function baixarAvaliacaoPdf(avaliacaoId: number) {
    try {
      await baixarAvaliacaoDiagnosticaPdf(avaliacaoId)
      success('PDF gerado', 'Arquivo baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  async function baixarAvaliacaoWord(avaliacaoId: number) {
    try {
      await baixarAvaliacaoDiagnosticaWord(avaliacaoId)
      success('Word gerado', 'Arquivo .docx baixado com sucesso.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  const avaliacoesDiagnosticasDoAluno = avaliacoesDiagnosticasDetalhes
    .filter((avaliacao) => {
      const containsByAlunoIds = avaliacao.alunoIds?.includes(alunoId) ?? false
      const containsByParticipantes = avaliacao.alunosParticipantes?.some((p) => p.alunoId === alunoId) ?? false
      const containsByAlunos = avaliacao.alunos?.some((a) => a.id === alunoId) ?? false
      return containsByAlunoIds || containsByParticipantes || containsByAlunos
    })
    .map((avaliacao) => {
      const resumo = avaliacoesDiagnosticasResumo.find((av) => av.id === avaliacao.id)
      return {
        id: avaliacao.id,
        titulo: avaliacao.titulo,
        dataAplicacao: avaliacao.dataAplicacao,
        status: resumo?.status ?? (avaliacao.concluida ? 'Concluida' : 'EmAndamento'),
      }
    })

  return (
    <>
      <PageHeader
        title={aluno.nomeCompleto}
        backTo="/alunos"
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilSimple size={16} />
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash size={16} weight="bold" />
              Excluir
            </Button>
          </div>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-black text-foreground">{aluno.nomeCompleto}</h2>
                {escola && (
                  <p className="text-sm text-muted-foreground mt-0.5">{escola.nomeInstituicao}</p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {aluno.nivelEnsino && <Badge variant="default">{aluno.nivelEnsino}</Badge>}
                  {aluno.turno && <Badge variant="muted">{aluno.turno}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info grid */}
        {infoItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {infoItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Icon size={12} />
                      {label}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {temAtendimentoAee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Atendimento no AEE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {aluno.frequenciaSemanalAtendimento != null && (
                <p>
                  <span className="text-muted-foreground">Frequência: </span>
                  <span className="font-semibold">{aluno.frequenciaSemanalAtendimento}x por semana</span>
                </p>
              )}
              {(aluno.diasSemanaAtendimento?.length ?? 0) > 0 && (
                <p>
                  <span className="text-muted-foreground">Dias: </span>
                  <span className="font-semibold">{aluno.diasSemanaAtendimento!.join(', ')}</span>
                </p>
              )}
              {aluno.duracaoAtendimentoMinutos != null && (
                <p>
                  <span className="text-muted-foreground">Duração: </span>
                  <span className="font-semibold">{aluno.duracaoAtendimentoMinutos} minutos</span>
                </p>
              )}
              {tipoAtendimentoLabel && (
                <p>
                  <span className="text-muted-foreground">Tipo: </span>
                  <span className="font-semibold">{tipoAtendimentoLabel}</span>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {aluno.perfilPedagogico?.trim() && (
          <Card>
            <CardHeader>
              <CardTitle>Perfil pedagógico do aluno</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-foreground whitespace-pre-wrap">{aluno.perfilPedagogico}</p>
            </CardContent>
          </Card>
        )}

        {/* Responsável */}
        {aluno.responsavel && (
          <Card>
            <CardHeader>
              <CardTitle>Responsável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-bold text-foreground">{aluno.responsavel.nomeCompleto}</p>
              <div className="flex flex-col gap-2">
                {aluno.responsavel.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={14} />
                    <span>{aluno.responsavel.telefone}</span>
                  </div>
                )}
                {aluno.responsavel.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Envelope size={14} />
                    <span>{aluno.responsavel.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planejamentos */}
        {aluno.planejamentos && aluno.planejamentos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>PAEE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {aluno.planejamentos.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{p.apelido}</p>
                    <p className="text-xs text-muted-foreground">{p.dataInicio} → {p.dataFim}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/planejamentos/${p.id}`)}>
                      <ArrowSquareOut size={14} />
                      Abrir
                    </Button>
                    <DownloadFormatMenu
                      ariaLabel={`Baixar PAEE ${p.apelido}`}
                      onPdf={() => baixarPaeePdf(p.id)}
                      onWord={() => baixarPaeeWord(p.id)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Estudos de caso */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Article size={20} />
              Estudos de caso
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => navigate(`/estudo-caso/nova/aluno?alunoId=${alunoId}`)}>
              <ArrowSquareOut size={14} />
              Novo estudo
            </Button>
          </CardHeader>
          <CardContent>
            {loadingEstudosCaso ? (
              <p className="text-sm text-muted-foreground">Carregando estudos de caso…</p>
            ) : estudosCaso.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum estudo de caso registrado para este aluno. Use &quot;Novo estudo&quot; para iniciar o assistente.
              </p>
            ) : (
              <div className="space-y-2">
                {estudosCaso.map((ec) => {
                  const semPaee = !aluno.planejamentos?.length
                  const podeCriarPaee = semPaee && ec.possuiTextoSimulado
                  const gerando = gerandoPaeeEstudoId === ec.id && gerarPaeeMutation.isPending
                  return (
                    <div key={ec.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground truncate">{ec.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          Atualizado em {new Date(ec.updatedAt).toLocaleString('pt-BR')}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {ec.possuiTextoSimulado ? (
                            <Badge variant="secondary">Documento gerado</Badge>
                          ) : (
                            <Badge variant="outline">Sem documento</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0flex-wrap">
                        {podeCriarPaee && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={gerando}
                            onClick={() => gerarPaeeMutation.mutate(ec.id)}
                          >
                            <Lightning size={14} />
                            Gerar PAEE
                          </Button>
                        )}
                        <DownloadFormatMenu
                          ariaLabel={`Baixar estudo de caso ${ec.titulo}`}
                          onPdf={() => baixarEstudoPdf(ec.id)}
                          onWord={() => baixarEstudoWord(ec.id)}
                        />
                        <Button size="sm" variant="outline" onClick={() => setEstudoCasoDetalheId(ec.id)}>
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avaliação Diagnóstica */}
        {loadingAvaliacoesDiagnosticas ? (
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Diagnóstica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Carregando avaliações diagnósticas...</p>
            </CardContent>
          </Card>
        ) : avaliacoesDiagnosticasDoAluno.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Diagnóstica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {avaliacoesDiagnosticasDoAluno.map((avaliacao) => (
                <div key={`avaliacao-${avaliacao.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{avaliacao.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Aplicação: {new Date(avaliacao.dataAplicacao).toLocaleDateString('pt-BR')} • {avaliacao.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/avaliacoes/editar/${avaliacao.id}/identificacao`)}>
                      <ArrowSquareOut size={14} />
                      Abrir
                    </Button>
                    <DownloadFormatMenu
                      ariaLabel={`Baixar avaliação ${avaliacao.titulo}`}
                      onPdf={() => baixarAvaliacaoPdf(avaliacao.id)}
                      onWord={() => baixarAvaliacaoWord(avaliacao.id)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}


      </motion.div>

      <EstudoCasoDetalheDialog
        open={estudoCasoDetalheId != null}
        onOpenChange={(open) => {
          if (!open) setEstudoCasoDetalheId(null)
        }}
        estudoId={estudoCasoDetalheId}
      />

      <AlunoFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false)
          qc.invalidateQueries({ queryKey: ['aluno', id] })
        }}
        escolas={escolas}
        editingAluno={aluno}
      />

      <AlunoExcluirDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        nomeCompleto={alunoNome}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(alunoId)}
      />
    </>
  )
}
