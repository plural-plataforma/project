import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  converterSecaoParaTextoCorrido,
  linhaEhPlaceholder,
  parseEstudoCasoDocumento,
  type LinhaEstudoCaso,
  type SecaoEstudoCaso,
} from '@/lib/parseEstudoCasoDocumento'

const SECOES_COM_TOGGLE_FORMATO = [
  'Levantamento das barreiras e potencialidades',
  'Avaliação pedagógica e funcional',
]

type FormatoSecao = 'padrao' | 'texto'

interface EstudoCasoDocumentoViewerProps {
  texto: string
  className?: string
  /** Altura máxima da área rolável do corpo do documento (Tailwind class). */
  scrollClassName?: string
}

function LinhaDocumento({ linha }: { linha: LinhaEstudoCaso }) {
  const placeholder = linhaEhPlaceholder(linha.texto)

  if (linha.tipo === 'subsecao') {
    return (
      <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/50 mt-5 mb-1.5 first:mt-0">
        {linha.texto.replace(/:$/, '')}
      </p>
    )
  }

  if (linha.tipo === 'bullet') {
    const conteudo = linha.texto.replace(/^•\s*/, '')
    return (
      <div className="flex gap-2.5 leading-relaxed">
        <span
          className={cn(
            'mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full',
            placeholder ? 'bg-amber-400' : 'bg-foreground/50'
          )}
          aria-hidden
        />
        <p
          className={cn(
            'text-[13px] text-foreground/85',
            placeholder && 'italic text-muted-foreground'
          )}
        >
          {conteudo}
        </p>
      </div>
    )
  }

  return (
    <p
      className={cn(
        'text-[13px] leading-relaxed text-justify text-foreground/85',
        placeholder &&
          'rounded border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1.5 italic text-muted-foreground'
      )}
    >
      {linha.texto}
    </p>
  )
}

function ToggleFormatoSecao({
  formato,
  onChange,
}: {
  formato: FormatoSecao
  onChange: (formato: FormatoSecao) => void
}) {
  return (
    <div className="flex shrink-0 rounded-md border border-border p-0.5 text-[11px]">
      {(
        [
          { valor: 'padrao', label: 'Padrão' },
          { valor: 'texto', label: 'Texto corrido' },
        ] as const
      ).map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          onClick={() => onChange(opcao.valor)}
          className={cn(
            'rounded px-2 py-0.5 font-medium transition-colors',
            formato === opcao.valor
              ? 'bg-primary text-white'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  )
}

function SecaoDocumento({ secao }: { secao: SecaoEstudoCaso }) {
  const [formato, setFormato] = useState<FormatoSecao>('padrao')
  const permiteToggle = SECOES_COM_TOGGLE_FORMATO.includes(secao.titulo)
  const secaoExibida = useMemo(
    () => (permiteToggle && formato === 'texto' ? converterSecaoParaTextoCorrido(secao) : secao),
    [permiteToggle, formato, secao]
  )

  return (
    <section>
      <h3 className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-1.5 mb-3">
        <span>
          <span className="text-[13px] font-bold text-primary shrink-0">{secao.numero}.</span>{' '}
          <span className="text-[13px] font-bold text-foreground">{secao.titulo}</span>
        </span>
        {permiteToggle && <ToggleFormatoSecao formato={formato} onChange={setFormato} />}
      </h3>
      <div className="space-y-1.5 pl-4">
        {secaoExibida.linhas.map((linha, idx) => (
          <LinhaDocumento
            key={`${secao.numero}-${idx}-${linha.texto.slice(0, 20)}`}
            linha={linha}
          />
        ))}
      </div>
    </section>
  )
}

export function EstudoCasoDocumentoViewer({
  texto,
  className,
  scrollClassName = 'max-h-[520px]',
}: EstudoCasoDocumentoViewerProps) {
  const doc = useMemo(() => parseEstudoCasoDocumento(texto), [texto])

  const metaEstudante = doc.metadados.find((m) => m.chave === 'Estudante')
  const metaAno = doc.metadados.find((m) => m.chave === 'Ano/Série')
  const metaData = doc.metadados.find((m) => m.chave === 'Data')
  const metaEscola = doc.metadados.find((m) => m.chave === 'Escola')
  const metaProfessor = doc.metadados.find((m) => m.chave === 'Professor(a) AEE')

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-white shadow-md',
        className
      )}
    >
      {/* Cabeçalho do documento */}
      <header className="border-b border-border px-8 py-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {doc.tituloDoc}
        </p>
        {doc.subtitulo && (
          <h2 className="mt-1.5 text-base font-bold leading-snug text-foreground sm:text-lg">
            {doc.subtitulo}
          </h2>
        )}
      </header>

      {/* Metadados — estilo ficha de documento */}
      {doc.metadados.length > 0 && (
        <div className="border-b border-border bg-muted/20 px-8 py-3 space-y-0.5">
          {(metaEstudante || metaAno || metaData) && (
            <p className="text-[12px] text-foreground/70">
              {[
                metaEstudante && `Estudante: ${metaEstudante.valor}`,
                metaAno && `Ano/Série: ${metaAno.valor}`,
                metaData && `Data: ${metaData.valor}`,
              ]
                .filter(Boolean)
                .join('   |   ')}
            </p>
          )}
          {(metaEscola || metaProfessor) && (
            <p className="text-[12px] text-foreground/70">
              {[
                metaEscola && `Escola: ${metaEscola.valor}`,
                metaProfessor && `Professor(a) AEE: ${metaProfessor.valor}`,
              ]
                .filter(Boolean)
                .join('   |   ')}
            </p>
          )}
        </div>
      )}

      {/* Corpo do documento */}
      <div className={cn('overflow-y-auto px-8 py-6 space-y-6', scrollClassName)}>
        {doc.secoes.map((secao) => (
          <SecaoDocumento key={`${secao.numero}-${secao.titulo}`} secao={secao} />
        ))}

        {doc.secoes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Não foi possível estruturar o documento para visualização.
          </p>
        )}
      </div>
    </article>
  )
}
