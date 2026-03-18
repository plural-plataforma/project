import { useMemo } from 'react'
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
  const selectedBlocos = useMemo(
    () => blocos.filter((b) => wizardData.blocos?.some((selected) => selected.blocoId === b.id) || wizardData.blocoIds?.includes(b.id)),
    [blocos, wizardData.blocoIds, wizardData.blocos]
  )

  const selectedAtividadesCount = useMemo(
    () => wizardData.blocos?.reduce((acc, bloco) => acc + bloco.atividadeIds.length, 0) ?? 0,
    [wizardData.blocos]
  )

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
    onError: (err: Error) => showError('Erro', err.message),
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
    onError: (err: Error) => showError('Erro', err.message),
  })

  return (
    <>
    <LoadingScreen
      visible={createMutation.isPending}
      message={isEditing ? 'Atualizando avaliação diagnóstica...' : 'Criando avaliação diagnóstica...'}
    />
    <div className="max-w-xl">
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

          {/* Blocos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Rows size={16} className="text-primary" />
                Blocos ({selectedBlocos.length}) • Atividades ({selectedAtividadesCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedBlocos.map((b) => (
                  <Badge key={b.id} variant="muted">{b.titulo}</Badge>
                ))}
              </div>
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
