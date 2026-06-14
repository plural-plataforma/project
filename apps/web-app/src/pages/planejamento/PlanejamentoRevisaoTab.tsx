import { CheckCircle, Circle, DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { avaliarCompletudePaee } from '@/lib/paeeCompletude'
import type { Planejamento } from '@/types/planejamento'

export interface PlanejamentoRevisaoTabProps {
  plano: Planejamento
  onExportWord: () => void
  exporting?: boolean
}

export function PlanejamentoRevisaoTab({ plano, onExportWord, exporting }: PlanejamentoRevisaoTabProps) {
  const { itens, completo, percentual } = avaliarCompletudePaee(plano)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Revisão antes do export</CardTitle>
          <span
            className={`text-sm font-medium ${completo ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}
          >
            {completo ? 'PAEE completo' : `${percentual}% preenchido`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Verifique os itens abaixo. Complete objetivos, encontros e assinatura nas abas correspondentes.
        </p>
        <ul className="space-y-2">
          {itens.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              {item.ok ? (
                <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
              ) : (
                <Circle size={18} className="text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>
                {item.label}
                {item.opcional ? ' (opcional)' : ''}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" type="button" loading={exporting} onClick={onExportWord}>
            <DownloadSimple size={14} /> Baixar Word
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
