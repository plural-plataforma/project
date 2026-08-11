import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cadastrarEstudoCaso, gerarTextoIAEstudoCaso } from '@/services/estudoCasoService'
import { useEstudoCasoWizardStore } from '@/stores/estudoCasoWizardStore'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'

/**
 * Cadastra o estudo de caso e gera o texto via IA (fluxo pós-etapa Eixos).
 * Gerador mecânico antigo desativado temporariamente — ver EstudoDeCasoService.GerarTextoIAAsync,
 * que espelha o resultado da IA em TextoSimulado pra manter o restante do app funcionando.
 */
export function useSalvarGerarEstudoCaso() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const alunoId = useEstudoCasoWizardStore((s) => s.alunoId)
  const titulo = useEstudoCasoWizardStore((s) => s.titulo)
  const contextoSituacao = useEstudoCasoWizardStore((s) => s.contextoSituacao)
  const potencialidades = useEstudoCasoWizardStore((s) => s.potencialidades)
  const eixosSelecionadosIds = useEstudoCasoWizardStore((s) => s.eixosSelecionadosIds)
  const anotacoesPorEixo = useEstudoCasoWizardStore((s) => s.anotacoesPorEixo)
  const setCasoSalvo = useEstudoCasoWizardStore((s) => s.setCasoSalvo)
  const setTextoGeradoIA = useEstudoCasoWizardStore((s) => s.setTextoGeradoIA)

  return useMutation({
    mutationFn: async () => {
      if (!alunoId) throw new Error('Aluno não selecionado.')
      const itensEixo = eixosSelecionadosIds.map((id) => ({
        eixoCatalogoId: id,
        anotacao: (anotacoesPorEixo[id] ?? '').trim() || undefined,
      }))
      const criado = await cadastrarEstudoCaso({
        alunoId,
        titulo: titulo.trim(),
        contextoSituacao: contextoSituacao.trim(),
        potencialidades: potencialidades.trim() || null,
        itensEixo,
      })
      return gerarTextoIAEstudoCaso(criado.id)
    },
    onSuccess: (detalhe) => {
      setCasoSalvo(detalhe.id, detalhe.textoSimulado ?? null)
      setTextoGeradoIA(detalhe.textoGeradoIA ?? null)
      const nomeApi = detalhe.alunoNomeCompleto?.trim()
      if (nomeApi) useEstudoCasoWizardStore.setState({ alunoNome: nomeApi })
      success('Estudo de caso gerado', 'Documento pronto para revisão e download.')
      void qc.invalidateQueries({ queryKey: ['estudos-caso-lista'] })
      void qc.invalidateQueries({ queryKey: ['estudos-caso'] })
      void qc.invalidateQueries({ queryKey: ['documentacao-pedagogica'] })
      void qc.invalidateQueries({ queryKey: ['estudos-caso-total'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })
}
