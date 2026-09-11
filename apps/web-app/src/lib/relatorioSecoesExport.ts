import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_ORDEM,
  type RelatorioSecao,
} from '@/types/relatorio'

/**
 * Corpo das 14 seções de IA do Relatório Pedagógico já pronto pra exportação — fonte única
 * pros exportadores docx e pdf, cada um só aplicando sua própria estilização, mesmo padrão
 * de `relatorioMetadados.ts`.
 *
 * Duas regras vindas da cliente: as notas manuais entram incorporadas ao texto da seção (não
 * como bloco separado e rotulado) e seção sem conteúdo algum não aparece no documento. Como a
 * omissão abre buracos na numeração fixa do template (`RELATORIO_SECAO_NUMERO`), o número é
 * recalculado sequencialmente a partir de 2 — a seção 1, Identificação, é escrita à parte.
 */

export interface RelatorioSecaoExport {
  titulo: string
  corpo: string
}

const PRIMEIRA_SECAO_NUMERADA = 2

function incorporarNotasManuais(texto: string, notasManuais: string): string {
  if (!texto) return notasManuais
  if (!notasManuais) return texto
  const precisaPonto = !/[.!?:;]$/.test(texto)
  return `${texto}${precisaPonto ? '.' : ''} ${notasManuais}`
}

export function montarSecoesRelatorioParaExport(secoes: RelatorioSecao[]): RelatorioSecaoExport[] {
  const secoesPorChave = new Map(secoes.map((s) => [s.secaoChave, s]))
  const resultado: RelatorioSecaoExport[] = []

  RELATORIO_SECAO_ORDEM.forEach((chave) => {
    const secao = secoesPorChave.get(chave)
    const texto = (secao?.textoEditado ?? secao?.textoGerado ?? '').trim()
    const corpo = incorporarNotasManuais(texto, secao?.notasManuais?.trim() ?? '')
    if (!corpo) return

    resultado.push({
      titulo: `${PRIMEIRA_SECAO_NUMERADA + resultado.length}. ${RELATORIO_SECAO_LABELS[chave]}`,
      corpo,
    })
  })

  return resultado
}
