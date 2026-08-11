import { jsPDF } from 'jspdf'
import { sanitizarTextoEstudoCaso } from '@/lib/sanitizarTextoEstudoCaso'

export interface ExportEstudoCasoPdfParams {
  tituloEstudo: string
  alunoNome: string
  textoCompleto: string
}

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'estudo_caso'
}

/**
 * As 4 etapas obrigatórias do Estudo de Caso, na ordem definida no system prompt
 * de geração por IA (mesma lista usada em EstudoCasoTextoIAViewer e exportEstudoCasoDocx).
 */
const ETAPAS_ESTUDO_CASO = [
  'Identificação inicial das demandas e barreiras',
  'Análise das barreiras e do contexto escolar',
  'Identificação das potencialidades e demandas de apoio',
  'Definição de estratégias e recursos para eliminação de barreiras',
]

const AZUL: [number, number, number] = [29, 53, 87]
const CINZA: [number, number, number] = [100, 100, 100]
const VERMELHO: [number, number, number] = [170, 0, 0]
const PRETO: [number, number, number] = [30, 30, 30]

/** PDF formatado conforme o template AEE definitivo, com quebra de página automática. */
export function downloadEstudoCasoPdf(params: ExportEstudoCasoPdfParams): void {
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

  // Cabeçalho
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...AZUL)
  escreverTexto('ESTUDO DE CASO — AEE', pageW / 2, y, { align: 'center', maxWidth: maxW })
  novaLinha(8)

  doc.setFontSize(12)
  escreverTexto(params.tituloEstudo, pageW / 2, y, { align: 'center', maxWidth: maxW })
  novaLinha(8)
  doc.setTextColor(...PRETO)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...CINZA)
  const nEstudante = escreverTexto(`Estudante: ${params.alunoNome}`, marginL, y, { maxWidth: maxW })
  novaLinha(nEstudante * 4.5 + 2)

  doc.setFontSize(7.5)
  doc.setTextColor(...VERMELHO)
  const nAviso = escreverTexto(
    'Documento gerado por Inteligência Artificial (beta) — revise antes de uso oficial.',
    marginL,
    y,
    { maxWidth: maxW }
  )
  novaLinha(nAviso * 4 + 6)
  doc.setTextColor(...PRETO)

  // Corpo — parágrafos gerados por IA (separados por linha em branco)
  const paragrafosTexto = sanitizarTextoEstudoCaso(params.textoCompleto)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const mapeiaEtapas = paragrafosTexto.length === ETAPAS_ESTUDO_CASO.length

  paragrafosTexto.forEach((paragrafo, idx) => {
    if (mapeiaEtapas) {
      if (y > pageH - marginB - 30) {
        doc.addPage()
        y = marginT
      } else {
        novaLinha(4)
      }
      doc.setFontSize(11.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...AZUL)
      const nTitulo = escreverTexto(`${idx + 1}. ${ETAPAS_ESTUDO_CASO[idx]}`, marginL, y, { maxWidth: maxW })
      novaLinha(nTitulo * 6 + 3)
      doc.setTextColor(...PRETO)
    }

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PRETO)
    const nCorpo = escreverTexto(paragrafo, marginL, y, { maxWidth: maxW })
    novaLinha(nCorpo * 5 + 6)
  })

  doc.save(`EstudoCaso_${slugArquivoPart(params.tituloEstudo)}.pdf`)
}
