import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { PencilSimple, GraduationCap, Phone, Envelope, User, DownloadSimple, ArrowSquareOut, Trash } from '@phosphor-icons/react'
import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx'
import { buscarAlunoPorId, excluirAluno } from '@/services/alunoService'
import { buscarEscolasProfessor } from '@/services/professorService'
import { buscarAvaliacaoPorId, buscarAvaliacoesDiagnosticas, gerarPdfBlob } from '@/services/avaliacaoDiagnosticaService'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { PlanejamentoAluno } from '@/types/planejamento'
import { AlunoFormDialog } from './AlunoFormDialog'
import { AlunoExcluirDialog } from './AlunoExcluirDialog'
import { useToast } from '@/hooks/useToast'

export default function AlunoProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

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

  const deleteMutation = useMutation({
    mutationFn: (studentId: number) => excluirAluno(studentId),
    onSuccess: () => {
      success('Aluno excluído', 'O cadastro foi removido.')
      setDeleteOpen(false)
      qc.invalidateQueries({ queryKey: ['alunos'] })
      navigate('/alunos', { replace: true })
    },
    onError: (err: Error) => showError('Não foi possível excluir', err.message),
  })

  if (isLoading) return <SkeletonList count={3} />
  if (!aluno) return <p className="text-muted-foreground">Aluno não encontrado.</p>
  const alunoId = aluno.id ?? 0
  const alunoNome = aluno.nomeCompleto
  const alunoAno = aluno.ano
  const alunoLaudos = aluno.laudos

  const initials = aluno.nomeCompleto
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const escola = escolas.find((e) => e.id === aluno.idEscola)

  const infoItems = [
    aluno.sexo && { icon: User, label: 'Sexo', value: ({ M: 'Masculino', F: 'Feminino', O: 'Outro' } as Record<string, string>)[aluno.sexo] ?? aluno.sexo },
    aluno.nivelEnsino && { icon: GraduationCap, label: 'Nível de ensino', value: aluno.nivelEnsino },
    aluno.turno && { icon: GraduationCap, label: 'Turno', value: aluno.turno },
    aluno.ano && { icon: GraduationCap, label: 'Ano/Série', value: aluno.ano },
  ].filter(Boolean) as Array<{ icon: React.ElementType; label: string; value: string }>

  async function exportarPdiWord(pdi: PlanejamentoAluno) {
    const laudos = alunoLaudos?.map((l) => l.codigoCid).filter(Boolean).join(', ') || 'Não informado'
    const periodoInicio = pdi.dataInicio ? new Date(pdi.dataInicio).toLocaleDateString('pt-BR') : 'Não informado'
    const periodoFim = pdi.dataFim ? new Date(pdi.dataFim).toLocaleDateString('pt-BR') : 'Não informado'
    const bullet = (text: string) =>
      new Paragraph({
        children: [new TextRun({ text: `• ${text}`, size: 24 })],
        indent: { left: 560 },
        spacing: { after: 180 },
      })

    const doc = new Document({
      creator: 'Plural Plataforma',
      title: `PDI - ${alunoNome}`,
      sections: [
        {
          properties: {
            page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'PLANO DE DESENVOLVIMENTO INDIVIDUAL - PDI', bold: true, size: 36 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 },
            }),

            new Paragraph({ children: [new TextRun({ text: '1. IDENTIFICAÇÃO DO (A) ALUNO (A):', bold: true, size: 26 })] }),
            new Paragraph({ children: [new TextRun('Nome: '), new TextRun({ text: alunoNome, bold: true })] }),
            new Paragraph({ children: [new TextRun(`Ano escolar/período: ${alunoAno || '___'}º ano`)] }),
            new Paragraph({ children: [new TextRun('Diagnóstico Médico: '), new TextRun(laudos)] }),
            new Paragraph({ spacing: { after: 600 } }),

            new Paragraph({ children: [new TextRun({ text: '2. ORGANIZAÇÃO DO ATENDIMENTO:', bold: true, size: 26 })] }),
            new Paragraph({ children: [new TextRun('Período de execução: '), new TextRun(`${periodoInicio} até ${periodoFim}`)] }),
            new Paragraph({ children: [new TextRun('Frequência do atendimento na semana: ( ) 1 Vez   ( ) 2 vezes   ( ) 3ª feira   ( ) 4ª feira   ( ) 5ª feira')] }),
            new Paragraph({ children: [new TextRun('Dia da semana: ( ) 2ª feira   ( ) 3ª feira   ( ) 4ª feira   ( ) 5ª feira')] }),
            new Paragraph({ children: [new TextRun('Composição do atendimento: ( ) Individual   ( ) Coletivo')] }),
            new Paragraph({ spacing: { after: 600 } }),

            new Paragraph({ children: [new TextRun({ text: '3. OBJETIVOS DO PLANO: (o que é preciso atingir, meta)', bold: true, size: 26 })] }),
            new Paragraph({ spacing: { after: 300 } }),
            ...(pdi.habilidades?.length
              ? pdi.habilidades.map((h) =>
                  bullet(h.descricao || h.resumo || `Habilidade ${h.id}`)
                )
              : [new Paragraph({
                children: [new TextRun({ text: '• Nenhuma habilidade vinculada.', italics: true, color: '666666' })],
                indent: { left: 560 },
                spacing: { after: 300 },
              })]),
            new Paragraph({ spacing: { after: 600 } }),

            new Paragraph({ children: [new TextRun({ text: '4. ESTRATÉGIAS A SEREM UTILIZADAS:', bold: true, size: 26 })] }),
            new Paragraph({ spacing: { after: 300 } }),
            ...(pdi.estrategias?.length
              ? pdi.estrategias.map((e) => bullet(e.descricao))
              : [new Paragraph({
                children: [new TextRun({ text: '• Nenhuma estratégia cadastrada.', italics: true, color: '666666' })],
                indent: { left: 560 },
                spacing: { after: 300 },
              })]),

            new Paragraph({ children: [new TextRun({ text: '5. CRITÉRIOS AVALIATIVOS:', bold: true, size: 26 })] }),
            new Paragraph({ spacing: { after: 300 } }),
            ...(pdi.avaliacao?.length
              ? pdi.avaliacao.map((a) => bullet(a.descricao))
              : [new Paragraph({
                children: [new TextRun({ text: '• Nenhum critério cadastrado.', italics: true, color: '666666' })],
                indent: { left: 560 },
                spacing: { after: 300 },
              })]),
            new Paragraph({ spacing: { after: 1000 } }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`,
                  italics: true,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `PDI_${alunoNome.replace(/[^a-zA-Z0-9]/g, '_')}_${pdi.apelido}.docx`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  async function baixarPdfAvaliacaoDiagnostica(avaliacaoId: number) {
    try {
      const blob = await gerarPdfBlob(avaliacaoId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `avaliacao-diagnostica-${avaliacaoId}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar PDF da avaliação diagnóstica:', error)
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
              <CardTitle>Planejamentos (PDI)</CardTitle>
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
                    <Button size="sm" onClick={() => exportarPdiWord(p)}>
                      <DownloadSimple size={14} />
                      Exportar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
                    <Button size="sm" variant="outline" onClick={() => navigate(`/avaliacoes/${avaliacao.id}/desempenho`)}>
                      Desempenho
                    </Button>
                    <Button size="sm" onClick={() => baixarPdfAvaliacaoDiagnostica(avaliacao.id)}>
                      <DownloadSimple size={14} />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}


      </motion.div>

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
