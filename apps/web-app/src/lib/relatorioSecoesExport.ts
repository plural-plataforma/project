import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_ORDEM,
  type RelatorioSecao,
} from '@/types/relatorio'

/**
 * Corpo das 14 seções de IA do Relatório Pedagógico, e também os parágrafos do texto corrido
 * final, já prontos pra exportação — fonte única pros exportadores docx e pdf, cada um só
 * aplicando sua própria estilização, mesmo padrão de `relatorioMetadados.ts`.
 *
 * Regra vinda da cliente: seção sem conteúdo algum não aparece no documento. Como a omissão
 * abre buracos na numeração fixa do template (`RELATORIO_SECAO_NUMERO`), o número é
 * recalculado sequencialmente a partir de 2 — a seção 1, Identificação, é escrita à parte.
 */

export interface RelatorioSecaoExport {
  titulo: string
  corpo: string
}

const PRIMEIRA_SECAO_NUMERADA = 2

export function montarSecoesRelatorioParaExport(secoes: RelatorioSecao[]): RelatorioSecaoExport[] {
  const secoesPorChave = new Map(secoes.map((s) => [s.secaoChave, s]))
  const resultado: RelatorioSecaoExport[] = []

  RELATORIO_SECAO_ORDEM.forEach((chave) => {
    const secao = secoesPorChave.get(chave)
    const corpo = (secao?.textoRevisado ?? secao?.textoEditado ?? secao?.textoGerado ?? '').trim()
    if (!corpo) return

    resultado.push({
      titulo: `${PRIMEIRA_SECAO_NUMERADA + resultado.length}. ${RELATORIO_SECAO_LABELS[chave]}`,
      corpo,
    })
  })

  return resultado
}

/** Parágrafos do `textoFinal` (modo texto corrido) prontos pra exportação — quebra por linha em branco e descarta os vazios. */
export function montarParagrafosTextoFinal(textoFinal: string): string[] {
  return textoFinal
    .split('\n\n')
    .map((paragrafo) => paragrafo.trim())
    .filter((paragrafo) => paragrafo.length > 0)
}
