import { useMemo } from 'react'
import { CalendarBlank, ChalkboardTeacher, GraduationCap, User } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  linhaEhPlaceholder,
  parseEstudoCasoDocumento,
  type LinhaEstudoCaso,
} from '@/lib/parseEstudoCasoDocumento'

interface EstudoCasoDocumentoViewerProps {
  texto: string
  className?: string
  /** Altura máxima da área rolável das seções (Tailwind class). */
  scrollClassName?: string
}

const METADADO_ICONE: Record<string, typeof User> = {
  Estudante: User,
  'Ano/Série': GraduationCap,
  Data: CalendarBlank,
  Escola: ChalkboardTeacher,
  'Professor(a) AEE': ChalkboardTeacher,
}

function LinhaDocumento({ linha }: { linha: LinhaEstudoCaso }) {
  const placeholder = linhaEhPlaceholder(linha.texto)

  if (linha.tipo === 'subsecao') {
    return (
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/80 mt-4 first:mt-0">
        {linha.texto.replace(/:$/, '')}
      </p>
    )
  }

  if (linha.tipo === 'bullet') {
    const conteudo = linha.texto.replace(/^•\s*/, '')
    return (
      <div className="flex gap-2.5 text-sm leading-relaxed">
        <span
          className={cn(
            'mt-2 h-1.5 w-1.5 shrink-0 rounded-full',
            placeholder ? 'bg-amber' : 'bg-primary'
          )}
          aria-hidden
        />
        <p className={cn('text-foreground/90', placeholder && 'text-muted-foreground italic')}>{conteudo}</p>
      </div>
    )
  }

  return (
    <p
      className={cn(
        'text-sm leading-relaxed text-foreground/90',
        placeholder && 'rounded-md border border-dashed border-amber/50 bg-amber-light px-3 py-2 text-muted-foreground italic'
      )}
    >
      {linha.texto}
    </p>
  )
}

export function EstudoCasoDocumentoViewer({
  texto,
  className,
  scrollClassName = 'max-h-[420px]',
}: EstudoCasoDocumentoViewerProps) {
  const doc = useMemo(() => parseEstudoCasoDocumento(texto), [texto])

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-card',
        className
      )}
    >
      <header className="border-b-4 border-amber bg-primary px-5 py-5 text-primary-foreground sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/80">
          {doc.tituloDoc}
        </p>
        <h2 className="mt-1.5 text-xl font-bold leading-snug text-primary-foreground sm:text-2xl">
          {doc.subtitulo || 'Estudo de caso'}
        </h2>
      </header>

      {doc.metadados.length > 0 && (
        <div className="grid gap-2 border-b border-border bg-muted/25 px-4 py-3 sm:grid-cols-2 sm:px-5">
          {doc.metadados.map((item) => {
            const Icone = METADADO_ICONE[item.chave] ?? User
            const valor = item.valor || '—'
            return (
              <div
                key={item.chave}
                className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/80 px-3 py-2"
              >
                <Icone size={16} weight="duotone" className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.chave}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate" title={valor}>
                    {valor}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className={cn('space-y-5 overflow-y-auto px-4 py-5 sm:px-5', scrollClassName)}>
        {doc.secoes.map((secao) => (
          <section
            key={`${secao.numero}-${secao.titulo}`}
            className="rounded-lg border border-border/70 bg-background/50 p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                {secao.numero}
              </span>
              <h3 className="pt-1 text-base font-semibold leading-snug text-foreground">{secao.titulo}</h3>
            </div>
            <div className="space-y-2 pl-0 sm:pl-11">
              {secao.linhas.map((linha, idx) => (
                <LinhaDocumento key={`${secao.numero}-${idx}-${linha.texto.slice(0, 24)}`} linha={linha} />
              ))}
            </div>
          </section>
        ))}

        {doc.secoes.length === 0 && (
          <p className="text-sm text-muted-foreground">Não foi possível estruturar o documento para visualização.</p>
        )}
      </div>
    </article>
  )
}
