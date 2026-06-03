import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Article, DownloadSimple, MagnifyingGlass, Plus, User } from '@phosphor-icons/react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonList } from '@/components/common/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { baixarEstudoCasoWord } from '@/lib/baixarEstudoCaso'
import { sortByField } from '@/lib/utils'
import { buscarAlunos } from '@/services/alunoService'
import { listarEstudosCaso } from '@/services/estudoCasoService'
import { EstudoCasoDetalheDialog } from '@/pages/estudo-caso/EstudoCasoDetalheDialog'

export default function EstudosCasoPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [filtroAluno, setFiltroAluno] = useState<string>('all')
  const [detalheId, setDetalheId] = useState<number | null>(null)

  const { data: alunos = [] } = useQuery({ queryKey: ['alunos'], queryFn: buscarAlunos })

  const { data: estudos = [], isLoading } = useQuery({
    queryKey: ['estudos-caso-lista'],
    queryFn: listarEstudosCaso,
  })

  const filtrados = useMemo(() => {
    const termo = search.trim().toLowerCase()
    return estudos
      .filter((ec) => {
        const matchAluno = filtroAluno === 'all' || String(ec.alunoId) === filtroAluno
        if (!matchAluno) return false
        if (!termo) return true
        return (
          ec.titulo.toLowerCase().includes(termo) ||
          ec.alunoNomeCompleto.toLowerCase().includes(termo)
        )
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [estudos, search, filtroAluno])

  async function baixar(estudoId: number) {
    try {
      await baixarEstudoCasoWord(estudoId)
      success('Download iniciado', 'Arquivo Word do estudo de caso baixado.')
    } catch (err: unknown) {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    }
  }

  return (
    <>
      <PageHeader
        title="Estudos de caso"
        description="Consulte e baixe os estudos de caso dos seus alunos."
        action={
          <Button onClick={() => navigate('/estudo-caso/nova/aluno')}>
            <Plus size={16} weight="bold" />
            Novo estudo de caso
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            label="Buscar"
            placeholder="Título ou nome do aluno…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<MagnifyingGlass size={16} />}
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="text-sm font-semibold mb-1.5 block">Aluno</label>
          <Select value={filtroAluno} onValueChange={setFiltroAluno}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {sortByField(alunos, 'nomeCompleto').map((a) => (
                <SelectItem key={a.id} value={String(a.id!)}>
                  {a.nomeCompleto}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : estudos.length === 0 ? (
        <EmptyState
          icon={<Article size={32} />}
          title="Nenhum estudo de caso"
          description="Crie o primeiro estudo de caso para registrar as observações pedagógicas do aluno."
          action={
            <Button onClick={() => navigate('/estudo-caso/nova/aluno')}>
              <Plus size={16} weight="bold" />
              Novo estudo de caso
            </Button>
          }
        />
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nenhum resultado para os filtros aplicados.
        </p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-semibold">Título</th>
                  <th className="px-3 py-2 font-semibold">Aluno</th>
                  <th className="px-3 py-2 font-semibold">Atualizado</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold w-[200px]" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((ec) => (
                  <tr key={ec.id} className="border-b border-border odd:bg-muted/20">
                    <td className="px-3 py-2 font-medium text-foreground">{ec.titulo}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-left"
                        onClick={() => navigate(`/alunos/${ec.alunoId}`)}
                      >
                        <User size={14} />
                        {ec.alunoNomeCompleto}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {new Date(ec.updatedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2">
                      {ec.possuiTextoSimulado ? (
                        <Badge variant="secondary">Rascunho disponível</Badge>
                      ) : (
                        <Badge variant="outline">Sem rascunho</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          aria-label={`Baixar estudo ${ec.titulo}`}
                          onClick={() => void baixar(ec.id)}
                        >
                          <DownloadSimple size={16} />
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={() => setDetalheId(ec.id)}>
                          Ver detalhes
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <EstudoCasoDetalheDialog
        open={detalheId != null}
        onOpenChange={(open) => {
          if (!open) setDetalheId(null)
        }}
        estudoId={detalheId}
      />
    </>
  )
}
