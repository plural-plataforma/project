import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface PlanejamentoAssinaturaTabProps {
  docAssinado: boolean
  setDocAssinado: (v: boolean) => void
  assinaturaNome: string
  setAssinaturaNome: (v: string) => void
  assinaturaCargo: string
  setAssinaturaCargo: (v: string) => void
  saving: boolean
  onSave: () => void
}

export function PlanejamentoAssinaturaTab({
  docAssinado,
  setDocAssinado,
  assinaturaNome,
  setAssinaturaNome,
  assinaturaCargo,
  setAssinaturaCargo,
  saving,
  onSave,
}: PlanejamentoAssinaturaTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assinatura do documento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Metadado para controle interno — não substitui assinatura digital certificada (ICP-Brasil).
        </p>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={docAssinado}
            onChange={(e) => setDocAssinado(e.target.checked)}
            className="rounded border-input"
          />
          Documento declarado como assinado
        </label>
        <Input
          label="Nome do responsável"
          value={assinaturaNome}
          onChange={(e) => setAssinaturaNome(e.target.value)}
          placeholder="Ex.: Maria Silva"
        />
        <Input
          label="Cargo / função"
          value={assinaturaCargo}
          onChange={(e) => setAssinaturaCargo(e.target.value)}
          placeholder="Ex.: Professora de AEE"
        />
        <div className="flex justify-end">
          <Button size="sm" loading={saving} onClick={onSave} type="button">
            Salvar assinatura
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
