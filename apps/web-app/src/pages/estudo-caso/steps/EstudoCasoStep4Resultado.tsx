import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { ArrowClockwise, CheckCircle, DownloadSimple, FilePdf, ListChecks } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { EstudoCasoTextoIAViewer } from '@/components/estudo-caso/EstudoCasoTextoIAViewer'
import { baixarEstudoCasoWord, baixarEstudoCasoPdf } from '@/lib/baixarEstudoCaso'
import { gerarTextoIAEstudoCaso } from '@/services/estudoCasoService'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import {
  useEstudoCasoWizardStore,
  estudoCasoStepIndex,
  ESTUDO_CASO_WIZARD_STEPS,
} from '@/stores/estudoCasoWizardStore'

export function EstudoCasoStep4Resultado() {
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const alunoId = useEstudoCasoWizardStore((s) => s.alunoId)
  const casoIdSalvo = useEstudoCasoWizardStore((s) => s.casoIdSalvo)
  const textoSimulado = useEstudoCasoWizardStore((s) => s.textoSimulado)
  const textoGeradoIA = useEstudoCasoWizardStore((s) => s.textoGeradoIA)
  const setTextoGeradoIA = useEstudoCasoWizardStore((s) => s.setTextoGeradoIA)
  const alunoNome = useEstudoCasoWizardStore((s) => s.alunoNome)
  const setStep = useEstudoCasoWizardStore((s) => s.setStep)
  const reset = useEstudoCasoWizardStore((s) => s.reset)

  const setCasoSalvo = useEstudoCasoWizardStore((s) => s.setCasoSalvo)

  const gerarIAMutation = useMutation({
    mutationFn: () => gerarTextoIAEstudoCaso(casoIdSalvo!),
    onSuccess: (d) => {
      setCasoSalvo(d.id, d.textoSimulado ?? null)
      setTextoGeradoIA(d.textoGeradoIA ?? null)
      success('Documento gerado por IA', 'Revise o texto antes de usar em documentos oficiais.')
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

  function concluir() {
    reset()
    navigate('/estudo-caso', { replace: true })
  }

  async function baixarWord() {
    if (!casoIdSalvo || !textoSimulado?.trim()) return
    try {
      await baixarEstudoCasoWord(casoIdSalvo)
      success('Documento gerado', 'Arquivo .docx baixado — revise antes de uso oficial.')
    } catch {
      showError('Download', 'Não foi possível baixar o arquivo Word.')
    }
  }

  async function baixarPdf() {
    if (!casoIdSalvo || !textoSimulado?.trim()) return
    try {
      await baixarEstudoCasoPdf(casoIdSalvo)
      success('PDF gerado', 'Arquivo baixado — revise antes de uso oficial.')
    } catch {
      showError('Download PDF', 'Não foi possível baixar o arquivo.')
    }
  }

  const jaSalvo = casoIdSalvo != null && textoSimulado != null

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Estudo de caso gerado</h2>
      </div>

      {!jaSalvo && (
        <>
          <p className="text-sm text-muted-foreground">
            O estudo ainda não foi gerado. Volte à etapa anterior e use &quot;Gerar estudo de caso&quot;.
          </p>
          <Button type="button" variant="outline" onClick={voltar}>
            Voltar aos eixos
          </Button>
        </>
      )}

      {jaSalvo && (
        <>
          <p className="text-sm font-medium text-foreground">
            Estudo #{casoIdSalvo} — revise o texto abaixo antes de exportar.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <EstudoCasoTextoIAViewer
              texto={textoGeradoIA ?? textoSimulado ?? ''}
              alunoNome={alunoNome ?? undefined}
              scrollClassName="max-h-[480px]"
            />
          </motion.div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={gerarIAMutation.isPending}
              onClick={() => gerarIAMutation.mutate()}
            >
              <ArrowClockwise size={14} />
              Gerar novamente
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={baixarPdf}>
                <FilePdf size={16} />
                Baixar PDF
              </Button>
              <Button type="button" variant="outline" onClick={baixarWord}>
                <DownloadSimple size={16} />
                Baixar Word
              </Button>
              <Button type="button" variant="outline" onClick={novo}>
                Novo estudo de caso
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/alunos/${alunoId}`)}>
                Ver perfil do aluno
              </Button>
            </div>
            <Button type="button" onClick={concluir}>
              <ListChecks size={16} weight="bold" />
              Concluir
            </Button>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Conclusão — etapa {estudoCasoStepIndex('eixos') + 1} de {ESTUDO_CASO_WIZARD_STEPS.length - 1}
      </p>
    </div>
  )
}
