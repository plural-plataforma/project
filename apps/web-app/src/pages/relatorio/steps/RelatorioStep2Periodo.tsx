import { useNavigate } from 'react-router-dom'
import { CalendarBlank } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useRelatorioWizardStore,
  canNavigateRelatorioTo,
  relatorioStepIndex,
  RELATORIO_WIZARD_STEPS,
} from '@/stores/relatorioWizardStore'
import { RELATORIO_TIPO_PERIODO_LABELS, type RelatorioTipoPeriodoCodigo } from '@/types/relatorio'

export function RelatorioStep2Periodo() {
  const navigate = useNavigate()
  const tipoPeriodo = useRelatorioWizardStore((s) => s.tipoPeriodo)
  const dataInicio = useRelatorioWizardStore((s) => s.dataInicio)
  const dataFim = useRelatorioWizardStore((s) => s.dataFim)
  const setTipoPeriodo = useRelatorioWizardStore((s) => s.setTipoPeriodo)
  const setDataInicio = useRelatorioWizardStore((s) => s.setDataInicio)
  const setDataFim = useRelatorioWizardStore((s) => s.setDataFim)
  const setStep = useRelatorioWizardStore((s) => s.setStep)

  const podeLevantamento = canNavigateRelatorioTo('levantamento', useRelatorioWizardStore.getState())

  function avancar() {
    if (!podeLevantamento) return
    setStep('levantamento')
    navigate('/relatorios/novo/levantamento')
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <CalendarBlank size={22} weight="duotone" />
        <h2 className="text-lg font-bold text-foreground">Período</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Defina o intervalo avaliado. A plataforma vai priorizar os dados registrados dentro dele
        (avaliações, PAEE, registros de atendimento) para montar o relatório.
      </p>

      <div>
        <label className="text-sm font-semibold mb-1.5 block">Tipo de período</label>
        <Select
          value={String(tipoPeriodo)}
          onValueChange={(v) => setTipoPeriodo(Number(v) as RelatorioTipoPeriodoCodigo)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{RELATORIO_TIPO_PERIODO_LABELS[0]}</SelectItem>
            <SelectItem value="1">{RELATORIO_TIPO_PERIODO_LABELS[1]}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Data início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <Input label="Data fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setStep('aluno')
            navigate('/relatorios/novo/aluno')
          }}
        >
          Voltar
        </Button>
        <Button type="button" onClick={avancar} disabled={!podeLevantamento}>
          Continuar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Etapa {relatorioStepIndex('periodo') + 1} de {RELATORIO_WIZARD_STEPS.length}
      </p>
    </div>
  )
}
