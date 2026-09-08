import { jsPDF } from 'jspdf'
import { montarCamposIdentificacaoRelatorio, type RelatorioMetadadosInput } from '@/lib/relatorioMetadados'
import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_NUMERO,
  RELATORIO_SECAO_ORDEM,
  type Relatorio,
} from '@/types/relatorio'

const AZUL: [number, number, number] = [29, 53, 87]
const CINZA: [number, number, number] = [100, 100, 100]
const PRETO: [number, number, number] = [30, 30, 30]

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'relatorio'
}

/** PDF do Relatório Pedagógico finalizado, seguindo o layout do template de 15 seções da cliente, com quebra de página automática. */
export function downloadRelatorioPdf(relatorio: Relatorio): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const marginL = 25
  const marginR = 20
  const marginT = 22
  const marginB = 22
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const maxW = pageW - marginL - marginR
  let y = marginT

  function novaLinha(altura: number) {
    y += altura
    if (y > pageH - marginB) {
      doc.addPage()
      y = marginT
    }
  }

  function garantirEspaco(minimo: number) {
    if (y > pageH - marginB - minimo) {
      doc.addPage()
      y = marginT
    } else {
      novaLinha(4)
    }
  }

  function escreverTexto(
    text: string,
    x: number,
    yPos: number,
    opts?: { maxWidth?: number; align?: 'left' | 'center' | 'right' }
  ): number {
    const linhasQuebradas = doc.splitTextToSize(text, opts?.maxWidth ?? maxW)
    const opcoes: Parameters<typeof doc.text>[3] = {}
    if (opts?.align) opcoes.align = opts.align
    doc.text(linhasQuebradas, x, yPos, opcoes)
    return linhasQuebradas.length
  }

  function escreverTituloSecao(titulo: string) {
    garantirEspaco(30)
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...AZUL)
    const n = escreverTexto(titulo, marginL, y, { maxWidth: maxW })
    novaLinha(n * 6 + 3)
    doc.setTextColor(...PRETO)
  }

  function escreverParagrafoCorpo(texto: string, italico = false) {
    doc.setFontSize(9.5)
    doc.setFont('helvetica', italico ? 'italic' : 'normal')
    doc.setTextColor(...PRETO)
    const n = escreverTexto(texto, marginL, y, { maxWidth: maxW })
    novaLinha(n * 5 + 6)
  }

  // Cabeçalho
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...AZUL)
  escreverTexto('RELATÓRIO PEDAGÓGICO DO AEE', pageW / 2, y, { align: 'center', maxWidth: maxW })
  novaLinha(8)
  doc.setTextColor(...PRETO)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...CINZA)
  const nEstudante = escreverTexto(`Estudante: ${relatorio.alunoNome}`, pageW / 2, y, {
    align: 'center',
    maxWidth: maxW,
  })
  novaLinha(nEstudante * 4.5 + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PRETO)

  // Identificação institucional/cadastro
  const identificacaoInput: RelatorioMetadadosInput = {
    escolaNomeInstituicao: relatorio.escolaNomeInstituicao,
    professorNomeCompleto: relatorio.professorNomeCompleto,
    alunoDataNascimento: relatorio.alunoDataNascimento,
    alunoAno: relatorio.alunoAno,
    alunoFrequenciaSemanalAtendimento: relatorio.alunoFrequenciaSemanalAtendimento,
    alunoDuracaoAtendimentoMinutos: relatorio.alunoDuracaoAtendimentoMinutos,
    alunoTipoAtendimentoAee: relatorio.alunoTipoAtendimentoAee,
    dataInicio: relatorio.dataInicio,
    dataFim: relatorio.dataFim,
    tipoPeriodoLabel: relatorio.tipoPeriodo === 1 ? 'Semestral' : 'Trimestral',
  }

  escreverTituloSecao('1. Identificação do estudante')
  for (const campo of montarCamposIdentificacaoRelatorio(identificacaoInput, relatorio.alunoNome)) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PRETO)
    const n = escreverTexto(`${campo.label}: ${campo.valor}`, marginL, y, { maxWidth: maxW })
    novaLinha(n * 4.6 + 2)
  }
  novaLinha(2)

  // Demais 14 seções
  const secoesPorChave = new Map(relatorio.secoes.map((s) => [s.secaoChave, s]))
  RELATORIO_SECAO_ORDEM.forEach((chave) => {
    const secao = secoesPorChave.get(chave)
    const texto = (secao?.textoEditado ?? secao?.textoGerado ?? '').trim()

    escreverTituloSecao(`${RELATORIO_SECAO_NUMERO[chave]}. ${RELATORIO_SECAO_LABELS[chave]}`)
    escreverParagrafoCorpo(texto || 'Informação insuficiente — não preenchida.')
    if (secao?.notasManuais?.trim()) {
      escreverParagrafoCorpo(`Notas manuais: ${secao.notasManuais.trim()}`, true)
    }
  })

  // Local e data, assinatura (mesmo padrão de export usado no PAEE)
  escreverTituloSecao('Local e data, assinatura')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PRETO)
  ;[
    ['Local e data', '_______________________________________________'],
    ['Professor(a) do AEE', relatorio.professorNomeCompleto?.trim() || 'não informado'],
    ['Assinatura', '_______________________________________________'],
  ].forEach(([label, valor]) => {
    const n = escreverTexto(`${label}: ${valor}`, marginL, y, { maxWidth: maxW })
    novaLinha(n * 4.6 + 4)
  })

  doc.save(`RelatorioPedagogico_${slugArquivoPart(relatorio.alunoNome)}.pdf`)
}
