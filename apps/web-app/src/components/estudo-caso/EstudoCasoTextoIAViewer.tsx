import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { montarSecoesIdentificacao, type EstudoCasoMetadadosInput } from '@/lib/estudoCasoMetadados'

/**
 * As 4 etapas obrigatórias do Estudo de Caso, na ordem definida no system prompt
 * de geração por IA (ver PromptSistemaIA, tipo EstudoCaso). O texto gerado é
 * prosa corrida (sem cabeçalho), um parágrafo por etapa nesta mesma ordem.
 */
const ETAPAS_ESTUDO_CASO = [
  'Identificação inicial das demandas e barreiras',
  'Análise das barreiras e do contexto escolar',
  'Identificação das potencialidades e demandas de apoio',
  'Definição de estratégias e recursos para eliminação de barreiras',
]

interface EstudoCasoTextoIAViewerProps {
  texto: string
  alunoNome?: string
  /** Quando ausente (ex: pré-visualização no wizard, antes de recarregar o detalhe
   * completo), a seção de identificação institucional/cadastro não é exibida —
   * o documento exportado (Word/PDF) sempre a inclui, buscando o detalhe completo. */
  metadados?: EstudoCasoMetadadosInput
  className?: string
  scrollClassName?: string
}

export function EstudoCasoTextoIAViewer({
  texto,
  alunoNome,
  metadados,
  className,
  scrollClassName = 'max-h-[520px]',
}: EstudoCasoTextoIAViewerProps) {
  const paragrafos = useMemo(
    () =>
      texto
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [texto]
  )

  // Só rotula por etapa quando o número de parágrafos bate com as 4 etapas
  // esperadas — evita rotular errado se a IA variar a estrutura. O backend já
  // normaliza pra sempre entregar exatamente 4, isso aqui é só uma segurança extra.
  const mapeiaEtapas = paragrafos.length === ETAPAS_ESTUDO_CASO.length

  const secoesIdentificacao = useMemo(
    () => (metadados ? montarSecoesIdentificacao(metadados) : []),
    [metadados]
  )

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-white shadow-md',
        className
      )}
    >
      <header className="border-b border-border px-8 py-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Estudo de Caso — gerado por IA (beta)
        </p>
        <h2 className="mt-1.5 text-base font-bold leading-snug text-foreground sm:text-lg">
          Revise o conteúdo antes de usar em documentos oficiais
        </h2>
        {alunoNome && <p className="mt-1 text-sm text-muted-foreground">Aluno(a): {alunoNome}</p>}
      </header>

      <div className={cn('overflow-y-auto px-8 py-6 space-y-6', scrollClassName)}>
        {secoesIdentificacao.map((secao) => (
          <section key={secao.titulo}>
            <h3 className="border-b border-border pb-1.5 mb-3 text-[13px] font-bold text-primary">
              {secao.titulo}
            </h3>
            {secao.campos ? (
              <dl className="space-y-1 pl-4">
                {secao.campos.map((campo) => (
                  <div key={campo.label} className="text-[12.5px] leading-relaxed text-foreground/85">
                    <dt className="inline font-semibold text-foreground">{campo.label}: </dt>
                    <dd className="inline">{campo.valor}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-foreground/85 pl-4">{secao.texto}</p>
            )}
          </section>
        ))}

        {paragrafos.map((paragrafo, idx) => (
          <section key={idx}>
            {mapeiaEtapas && (
              <h3 className="flex items-baseline gap-2 border-b border-border pb-1.5 mb-3">
                <span className="text-[13px] font-bold text-primary shrink-0">{idx + 1}.</span>
                <span className="text-[13px] font-bold text-foreground">
                  {ETAPAS_ESTUDO_CASO[idx]}
                </span>
              </h3>
            )}
            <p className="text-[13px] leading-relaxed text-justify text-foreground/85 pl-4">
              {paragrafo}
            </p>
          </section>
        ))}

        {paragrafos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Não foi possível exibir o texto gerado por IA.
          </p>
        )}
      </div>
    </article>
  )
}
