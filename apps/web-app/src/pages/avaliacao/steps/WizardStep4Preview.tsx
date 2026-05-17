import { useMemo } from 'react'
import type { Atividade } from '@/types/atividades'
import type { BlocoComAtividade } from '@/types/bloco'
import {
  labelNivelDificuldade,
  resumoEtapaEnsino,
} from '@/pages/avaliacao/avaliacaoAreaConstants'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, ArrowLeft, CalendarBlank, Buildings, Users, Rows, DownloadSimple } from '@phosphor-icons/react'
import { useAvaliacaoWizardStore } from '@/stores/avaliacaoWizardStore'
import { atualizarAvaliacaoDiagnostica, criarAvaliacaoDiagnostica, gerarPdfBlob } from '@/services/avaliacaoDiagnosticaService'
import { buscarAlunos } from '@/services/alunoService'
import { buscarEscolasProfessor } from '@/services/professorService'
import { buscarBlocosComAtividades } from '@/services/blocosService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import dayjs from 'dayjs'

export function WizardStep4Preview() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: wizardData, reset, isEditing, avaliacaoId } = useAvaliacaoWizardStore()
  const { success, error: showError } = useToast()

  const { data: alunos = [] } = useQuery({ queryKey: ['alunos'], queryFn: buscarAlunos })
  const { data: escolas = [] } = useQuery({ queryKey: ['escolas-professor'], queryFn: buscarEscolasProfessor })
  const { data: blocos = [] } = useQuery({ queryKey: ['blocos-com-atividades'], queryFn: buscarBlocosComAtividades })

  const escola = escolas.find((e) => e.id === wizardData.escolaId)
  const selectedAlunos = alunos.filter((a) => wizardData.alunoIds?.includes(a.id!))

  const selectedAtividadesCount = useMemo(
    () => wizardData.blocos?.reduce((acc, bloco) => acc + bloco.atividadeIds.length, 0) ?? 0,
    [wizardData.blocos]
  )

  /** Eixo (bloco) + atividades selecionadas com nível e etapa para revisão. */
  const revisaoPorEixo = useMemo(() => {
    const selecao = wizardData.blocos
    if (!selecao?.length) return [] as { bloco: BlocoComAtividade; atividades: Atividade[] }[]

    const resultado: { bloco: BlocoComAtividade; atividades: Atividade[] }[] = []
    for (const sel of selecao) {
      const bloco = blocos.find((b) => b.id === sel.blocoId)
      if (!bloco) continue
      const atividades: Atividade[] = []
      for (const id of sel.atividadeIds) {
        const atv = bloco.atividades.find((a) => a.id === id)
        if (atv) atividades.push(atv)
      }
      if (atividades.length > 0) resultado.push({ bloco, atividades })
    }
    return resultado
  }, [wizardData.blocos, blocos])

  const createMutation = useMutation({
    mutationFn: () =>
      isEditing && avaliacaoId
        ? atualizarAvaliacaoDiagnostica(avaliacaoId, {
            id: avaliacaoId,
            titulo: wizardData.titulo!,
            dataAplicacao: wizardData.dataAplicacao,
            escolaId: wizardData.escolaId ?? null,
            alunoIds: wizardData.alunoIds!,
            blocoIds: wizardData.blocoIds,
            blocos: wizardData.blocos,
            objetivo: wizardData.objetivo,
            concluida: false,
          })
        : criarAvaliacaoDiagnostica({
            titulo: wizardData.titulo!,
            dataAplicacao: wizardData.dataAplicacao,
            escolaId: wizardData.escolaId ?? null,
            alunoIds: wizardData.alunoIds!,
            blocoIds: wizardData.blocoIds,
            blocos: wizardData.blocos,
            objetivo: wizardData.objetivo,
            concluida: false,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avaliacoes-diagnosticas'] })
      success(
        isEditing ? 'Avaliação atualizada!' : 'Avaliação criada!',
        isEditing
          ? 'A avaliação diagnóstica foi atualizada com sucesso.'
          : 'A avaliação diagnóstica foi criada com sucesso.'
      )
      reset()
      setTimeout(() => navigate('/avaliacoes'), 1000)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  const pdfMutation = useMutation({
    mutationFn: async () => {
      const idParaPdf = avaliacaoId ?? wizardData.id
      if (!idParaPdf) throw new Error('Salve a avaliação para gerar o PDF.')
      const blob = await gerarPdfBlob(idParaPdf)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `avaliacao-diagnostica-${idParaPdf}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  return (
    <>
    <LoadingScreen
      visible={createMutation.isPending}
      message={isEditing ? 'Atualizando avaliação diagnóstica...' : 'Criando avaliação diagnóstica...'}
    />
    <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">Revisar e Confirmar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Confira todos os dados antes de criar a avaliação.
          </p>
        </div>

        <div className="space-y-4">
          {/* Summary card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-lg font-black text-foreground">{wizardData.titulo}</p>
                {wizardData.objetivo && (
                  <p className="text-sm text-muted-foreground mt-1">{wizardData.objetivo}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {wizardData.dataAplicacao && (
                  <div className="flex items-center gap-1.5">
                    <CalendarBlank size={14} />
                    {dayjs(wizardData.dataAplicacao).format('DD/MM/YYYY')}
                  </div>
                )}
                {escola && (
                  <div className="flex items-center gap-1.5">
                    <Buildings size={14} />
                    {escola.nomeInstituicao}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alunos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users size={16} className="text-primary" />
                Alunos ({selectedAlunos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedAlunos.map((a) => (
                  <Badge key={a.id} variant="default">{a.nomeCompleto}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Eixos, níveis, etapas e atividades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rows size={16} className="text-primary" />
                Áreas e atividades ({selectedAtividadesCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {revisaoPorEixo.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade selecionada. Volte à etapa anterior para escolher eixo, nível, etapa e
                  atividades.
                </p>
              ) : (
                revisaoPorEixo.map(({ bloco, atividades }) => (
                  <div key={bloco.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Eixo
                      </p>
                      <p className="text-sm font-bold text-foreground">{bloco.titulo}</p>
                    </div>
                    <ul className="space-y-3 list-none m-0 p-0">
                      {atividades.map((atv) => (
                        <li
                          key={atv.id}
                          className="rounded-md border border-border bg-card px-3 py-2.5 space-y-2"
                        >
                          <p className="text-sm font-semibold text-foreground leading-snug">{atv.titulo}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground font-medium">Nível de dificuldade: </span>
                              <span className="text-foreground">{labelNivelDificuldade(atv.nivel)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground font-medium">Etapa de ensino: </span>
                              <span className="text-foreground">{resumoEtapaEnsino(atv)}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(isEditing && avaliacaoId ? `/avaliacoes/editar/${avaliacaoId}/areas` : '/avaliacoes/nova/areas')
            }
          >
              <ArrowLeft size={16} />
              Voltar
            </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => pdfMutation.mutate()}
              loading={pdfMutation.isPending}
              disabled={!isEditing || !avaliacaoId}
              title={!isEditing ? 'Salve a avaliação para gerar o PDF' : undefined}
            >
              <DownloadSimple size={16} />
              Baixar PDF
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
            >
              <CheckCircle size={16} weight="bold" />
              {isEditing ? 'Salvar alterações' : 'Criar avaliação'}
            </Button>
          </div>
          </div>
        </div>
      </div>
    </>
  )
}
