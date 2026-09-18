import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { montarSecoesRelatorioParaExport } from '@/lib/relatorioSecoesExport'
import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_NUMERO,
  RELATORIO_SECAO_ORDEM,
  type Relatorio,
} from '@/types/relatorio'

interface RelatorioRevisaoFinalProps {
  relatorio: Relatorio
  aceitando: boolean
  descartando: boolean
  onAceitar: () => void
  onDescartar: () => void
}

// Depende de uma invariante do backend: no modo texto corrido, `ProcessarRevisaoFinalAsync`
// (RelatorioService.cs) nunca preenche `TextoRevisado` por seção — só grava o resultado da IA
// em `relatorio.TextoFinal`. Por isso `montarSecoesRelatorioParaExport` aqui sempre cai em
// `textoEditado ?? textoGerado`, e este "Seu texto" continua mostrando o original da professora.
// Se o backend passar a preencher `TextoRevisado` também nesse modo, este painel passaria a
// mostrar texto já revisado como se fosse o original.
function montarTextoOriginalConcatenado(relatorio: Relatorio): string {
  return montarSecoesRelatorioParaExport(relatorio.secoes)
    .map((secao) => secao.corpo)
    .join('\n\n')
}

export function RelatorioRevisaoFinal({
  relatorio,
  aceitando,
  descartando,
  onAceitar,
  onDescartar,
}: RelatorioRevisaoFinalProps) {
  const secoesPorChave = new Map(relatorio.secoes.map((s) => [s.secaoChave, s]))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revisão da IA pronta</CardTitle>
        <CardDescription>
          A IA revisou a redação para deixá-la mais clara, sem mudar nenhuma informação. Compare o antes e o
          depois de cada trecho e escolha se quer usar esta versão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {relatorio.formatoFinal === 1 ? (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Seu texto</p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{montarTextoOriginalConcatenado(relatorio)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Revisado pela IA</p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{relatorio.textoFinal}</p>
            </div>
          </div>
        ) : (
          RELATORIO_SECAO_ORDEM.map((chave) => {
            const secao = secoesPorChave.get(chave)
            if (!secao?.textoRevisado) return null

            return (
              <div key={chave} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  {RELATORIO_SECAO_NUMERO[chave]}. {RELATORIO_SECAO_LABELS[chave]}
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Seu texto</p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {secao.textoEditado ?? secao.textoGerado ?? ''}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Revisado pela IA</p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{secao.textoRevisado}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" loading={descartando} onClick={onDescartar}>
          Descartar
        </Button>
        <Button loading={aceitando} onClick={onAceitar}>
          Usar esta versão
        </Button>
      </CardFooter>
    </Card>
  )
}
