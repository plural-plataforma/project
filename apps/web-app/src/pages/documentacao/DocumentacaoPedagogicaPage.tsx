import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DownloadSimple, Files } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { baixarFusaoEstudoCasoPaee } from '@/lib/baixarFusaoEstudoCasoPaee'
import { avaliarCompletudePaee } from '@/lib/paeeCompletude'
import { buscarAlunos } from '@/services/alunoService'
import { listarEstudosCasoPorAluno } from '@/services/estudoCasoService'
import { buscarPlanejamento } from '@/services/planejamentoService'

export interface FusaoEstudoPaeeItem {
  alunoId: number
  alunoNome: string
  estudoId: number
  estudoTitulo: string
  planejamentoId: number
  planejamentoApelido: string
}

async function listarFusoesDisponiveis(): Promise<FusaoEstudoPaeeItem[]> {
  const [alunos, planejamentos] = await Promise.all([buscarAlunos(), buscarPlanejamento()])
  const itens: FusaoEstudoPaeeItem[] = []

  for (const aluno of alunos) {
    const aid = aluno.id
    if (aid == null) continue

    const paees = planejamentos.filter((p) => (p.alunos ?? []).some((a) => a.id === aid))
    if (paees.length === 0) continue

    const estudos = await listarEstudosCasoPorAluno(aid)
    const estudoConcluido = estudos.find((e) => e.possuiTextoSimulado)
    if (!estudoConcluido) continue

    const paee = [...paees]
      .filter((p) => avaliarCompletudePaee(p).completo)
      .sort((a, b) => new Date(b.dataFim).getTime() - new Date(a.dataFim).getTime())[0]
    if (!paee) continue

    const estudo = [...estudos].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0]

    itens.push({
      alunoId: aid,
      alunoNome: aluno.nomeCompleto,
      estudoId: estudo.id,
      estudoTitulo: estudo.titulo,
      planejamentoId: paee.id,
      planejamentoApelido: paee.apelido,
    })
  }

  return itens.sort((a, b) => a.alunoNome.localeCompare(b.alunoNome, 'pt-BR'))
}

export async function contarFusoesEstudoPaeeDisponiveis(): Promise<number> {
  const lista = await listarFusoesDisponiveis()
  return lista.length
}

export default function DocumentacaoPedagogicaPage() {
  const { success, error: showError } = useToast()
  const { data: fusoes = [], isLoading } = useQuery({
    queryKey: ['documentacao-pedagogica-fusoes'],
    queryFn: listarFusoesDisponiveis,
  })

  const total = useMemo(() => fusoes.length, [fusoes.length])

  async function baixar(item: FusaoEstudoPaeeItem) {
    try {
      await baixarFusaoEstudoCasoPaee({
        estudoId: item.estudoId,
        planejamentoId: item.planejamentoId,
        alunoNome: item.alunoNome,
      })
      success('Download iniciado', 'Estudo de caso e PAEE baixados — revise antes do uso oficial.')
    } catch (e: unknown) {
      const fb = getApiErrorFeedback(e)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudo de caso + PAEE"
        description="Alunos com estudo de caso e PAEE preenchidos. Baixe a documentação pedagógica consolidada."
      />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : total === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Nenhum aluno com estudo de caso e PAEE completos ainda. Conclua os dois documentos no perfil do
              aluno para liberar o download aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Files size={20} />
              {total} aluno{total !== 1 ? 's' : ''} com documentação completa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fusoes.map((item) => (
              <div
                key={`${item.alunoId}-${item.estudoId}-${item.planejamentoId}`}
                className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{item.alunoNome}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Estudo: {item.estudoTitulo} · PAEE: {item.planejamentoApelido}
                  </p>
                </div>
                <Button type="button" size="sm" onClick={() => void baixar(item)}>
                  <DownloadSimple size={16} />
                  Baixar documentação
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
