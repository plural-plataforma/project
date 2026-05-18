import { useNavigate } from 'react-router-dom'
import { Article } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useEstudoCasoWizardStore,
  canNavigateEstudoCasoTo,
  estudoCasoStepIndex,
  ESTUDO_CASO_WIZARD_STEPS,
} from '@/stores/estudoCasoWizardStore'

export function EstudoCasoStep2Contexto() {
  const navigate = useNavigate()
  const titulo = useEstudoCasoWizardStore((s) => s.titulo)
  const contextoSituacao = useEstudoCasoWizardStore((s) => s.contextoSituacao)
  const alunoId = useEstudoCasoWizardStore((s) => s.alunoId)
  const setTitulo = useEstudoCasoWizardStore((s) => s.setTitulo)
  const setContexto = useEstudoCasoWizardStore((s) => s.setContexto)
  const setStep = useEstudoCasoWizardStore((s) => s.setStep)

  const store = useEstudoCasoWizardStore.getState()

  function voltar() {
    setStep('aluno')
    navigate('/estudo-caso/nova/aluno')
  }

  function avancar() {
    setStep('eixos')
    navigate('/estudo-caso/nova/eixos')
  }

  const ok = canNavigateEstudoCasoTo('eixos', {
    ...store,
    titulo,
    contextoSituacao,
    alunoId,
  })

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Article size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Contexto</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Título e descrição da situação observada (sala, AEE, convivência etc.).
      </p>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="ec-titulo">
          Título do estudo de caso
        </label>
        <Input
          id="ec-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Participação em rodas de leitura"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="ec-ctx">
          Situação / contexto
        </label>
        <textarea
          id="ec-ctx"
          rows={6}
          value={contextoSituacao}
          onChange={(e) => setContexto(e.target.value)}
          placeholder="Descreva fatos relevantes, frequência, suportes já testados…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={voltar}>
          Voltar
        </Button>
        <Button type="button" onClick={avancar} disabled={!ok}>
          Continuar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Etapa {estudoCasoStepIndex('contexto') + 1} de {ESTUDO_CASO_WIZARD_STEPS.length}
      </p>
    </div>
  )
}
