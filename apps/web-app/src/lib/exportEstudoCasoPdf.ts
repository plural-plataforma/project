import { jsPDF } from 'jspdf'

export interface ExportEstudoCasoPdfParams {
  tituloEstudo: string
  alunoNome: string
  textoCompleto: string
}

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'estudo_caso'
}

/** PDF texto simples (multi-página) para arquivo oficial / impressão — mesmo conteúdo do Word. */
export function downloadEstudoCasoPdf(params: ExportEstudoCasoPdfParams): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const margin = 18
  const pageW = doc.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = margin

  doc.setFontSize(14)
  doc.text('Estudo de caso — Plural (rascunho simulado)', margin, y, { maxWidth: maxW })
  y += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(params.tituloEstudo, margin, y, { maxWidth: maxW })
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Aluno(a): ${params.alunoNome}`, margin, y, { maxWidth: maxW })
  y += 12

  doc.setFontSize(10)
  const linhas = doc.splitTextToSize(params.textoCompleto, maxW)

  const alturaLinha = 5
  const alturaPagina = doc.internal.pageSize.getHeight()
  const rodape = margin + 10

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    if (y + alturaLinha > alturaPagina - rodape) {
      doc.addPage()
      y = margin
    }
    doc.text(linha, margin, y)
    y += alturaLinha
  }

  doc.save(`EstudoCaso_${slugArquivoPart(params.tituloEstudo)}.pdf`)
}
