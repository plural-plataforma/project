import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buscarObjetivosPaeeCatalogo } from '@/services/planejamentoService'
import type { PaeeObjetivoCatalogo } from '@/types/planejamento'

export interface PlanejamentoObjetivosTabProps {
  objCurto: string
  objMedio: string
  objLongo: string
  objCurtoCatalogoId: number | null
  objMedioCatalogoId: number | null
  objLongoCatalogoId: number | null
  onObjCurtoChange: (v: string) => void
  onObjMedioChange: (v: string) => void
  onObjLongoChange: (v: string) => void
  onObjCurtoCatalogoIdChange: (id: number | null) => void
  onObjMedioCatalogoIdChange: (id: number | null) => void
  onObjLongoCatalogoIdChange: (id: number | null) => void
  onSave: () => void
  saving: boolean
}

function catalogoPorPrazo(itens: PaeeObjetivoCatalogo[], prazo: 'Curto' | 'Medio' | 'Longo') {
  return itens.filter((i) => i.prazo === prazo)
}

function ObjetivoCampo({
  id,
  label,
  prazo,
  catalogo,
  catalogoId,
  texto,
  onCatalogoIdChange,
  onTextoChange,
}: {
  id: string
  label: string
  prazo: 'Curto' | 'Medio' | 'Longo'
  catalogo: PaeeObjetivoCatalogo[]
  catalogoId: number | null
  texto: string
  onCatalogoIdChange: (id: number | null) => void
  onTextoChange: (v: string) => void
}) {
  const opcoes = catalogoPorPrazo(catalogo, prazo)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <select
        id={`${id}-catalogo`}
        aria-label={`Modelo de objetivo ${label}`}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={catalogoId ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') {
            onCatalogoIdChange(null)
            return
          }
          const itemId = Number(raw)
          const item = opcoes.find((o) => o.id === itemId)
          onCatalogoIdChange(itemId)
          if (item?.textoModelo) onTextoChange(item.textoModelo)
        }}
      >
        <option value="">Selecionar modelo do catálogo (opcional)</option>
        {opcoes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.rotulo}
          </option>
        ))}
      </select>
      <textarea
        id={id}
        rows={3}
        value={texto}
        onChange={(e) => onTextoChange(e.target.value)}
        placeholder="Refine ou escreva o objetivo..."
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  )
}

export function PlanejamentoObjetivosTab({
  objCurto,
  objMedio,
  objLongo,
  objCurtoCatalogoId,
  objMedioCatalogoId,
  objLongoCatalogoId,
  onObjCurtoChange,
  onObjMedioChange,
  onObjLongoChange,
  onObjCurtoCatalogoIdChange,
  onObjMedioCatalogoIdChange,
  onObjLongoCatalogoIdChange,
  onSave,
  saving,
}: PlanejamentoObjetivosTabProps) {
  const { data: catalogo = [], isLoading } = useQuery({
    queryKey: ['paee-objetivos-catalogo'],
    queryFn: buscarObjetivosPaeeCatalogo,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Objetivos (curto, médio e longo prazo)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione um modelo do catálogo pedagógico e refine o texto conforme a necessidade do estudante.
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
        ) : (
          <>
            <ObjetivoCampo
              id="obj-curto"
              label="Curto prazo"
              prazo="Curto"
              catalogo={catalogo}
              catalogoId={objCurtoCatalogoId}
              texto={objCurto}
              onCatalogoIdChange={onObjCurtoCatalogoIdChange}
              onTextoChange={onObjCurtoChange}
            />
            <ObjetivoCampo
              id="obj-medio"
              label="Médio prazo"
              prazo="Medio"
              catalogo={catalogo}
              catalogoId={objMedioCatalogoId}
              texto={objMedio}
              onCatalogoIdChange={onObjMedioCatalogoIdChange}
              onTextoChange={onObjMedioChange}
            />
            <ObjetivoCampo
              id="obj-longo"
              label="Longo prazo"
              prazo="Longo"
              catalogo={catalogo}
              catalogoId={objLongoCatalogoId}
              texto={objLongo}
              onCatalogoIdChange={onObjLongoCatalogoIdChange}
              onTextoChange={onObjLongoChange}
            />
          </>
        )}
        <div className="flex justify-end">
          <Button size="sm" loading={saving} onClick={onSave} type="button">
            Salvar objetivos
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
