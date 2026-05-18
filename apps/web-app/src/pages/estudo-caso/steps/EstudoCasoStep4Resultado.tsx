import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import { cadastrarEstudoCaso, gerarTextoSimuladoEstudoCaso } from '@/services/estudoCasoService'
import {
  useEstudoCasoWizardStore,
  estudoCasoStepIndex,
  ESTUDO_CASO_WIZARD_STEPS,
} from '@/stores/estudoCasoWizardStore'

export function EstudoCasoStep4Resultado() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const alunoId = useEstudoCasoWizardStore((s) => s.alunoId)
  const titulo = useEstudoCasoWizardStore((s) => s.titulo)
  const contextoSituacao = useEstudoCasoWizardStore((s) => s.contextoSituacao)
  const eixosSelecionadosIds = useEstudoCasoWizardStore((s) => s.eixosSelecionadosIds)
  const anotacoesPorEixo = useEstudoCasoWizardStore((s) => s.anotacoesPorEixo)
  const casoIdSalvo = useEstudoCasoWizardStore((s) => s.casoIdSalvo)
  const textoSimulado = useEstudoCasoWizardStore((s) => s.textoSimulado)
  const setStep = useEstudoCasoWizardStore((s) => s.setStep)
  const setCasoSalvo = useEstudoCasoWizardStore((s) => s.setCasoSalvo)
  const reset = useEstudoCasoWizardStore((s) => s.reset)

  const salvarMutation = useMutation({
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
        itensEixo,
      })
      const comTexto = await gerarTextoSimuladoEstudoCaso(criado.id)
      return comTexto
    },
    onSuccess: (detalhe) => {
      setCasoSalvo(detalhe.id, detalhe.textoSimulado ?? null)
      success('Estudo de caso salvo', 'Rascunho simulado gerado. Revise antes de usar oficialmente.')
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  function voltar() {
    setStep('eixos')
    navigate('/estudo-caso/nova/eixos')
  }

  function novo() {
    reset()
    navigate('/estudo-caso/nova/aluno', { replace: true })
  }

  const jaSalvo = casoIdSalvo != null && textoSimulado != null

  return (
    <>
      <LoadingScreen visible={salvarMutation.isPending} message="Salvando e gerando rascunho…" />
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle size={22} weight="duotone" />
          <h2 className="text-lg font-bold text-foreground">Resultado</h2>
        </div>

        {!jaSalvo && (
          <>
            <p className="text-sm text-muted-foreground">
              Confirme para registrar o estudo de caso e gerar um <strong>texto simulado</strong> (rascunho
              automático para apoio ao PAEE — exige revisão humana).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={voltar}>
                Voltar
              </Button>
              <Button
                type="button"
                onClick={() => salvarMutation.mutate()}
                loading={salvarMutation.isPending}
              >
                Salvar e gerar texto simulado
              </Button>
            </div>
          </>
        )}

        {jaSalvo && (
          <>
            <p className="text-sm font-medium text-foreground">
              Estudo #{casoIdSalvo} — texto abaixo pode ser copiado e editado externamente.
            </p>
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground max-h-[420px] overflow-y-auto">
              {textoSimulado}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={novo}>
                Novo estudo de caso
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/alunos/${alunoId}`)}>
                Ver perfil do aluno
              </Button>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Etapa {estudoCasoStepIndex('resultado') + 1} de {ESTUDO_CASO_WIZARD_STEPS.length}
        </p>
      </div>
    </>
  )
}
