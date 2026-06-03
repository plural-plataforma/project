import { downloadAvaliacaoDiagnosticaDocx } from '@/lib/exportAvaliacaoDiagnosticaDocx'
import { buscarAvaliacaoPorId, gerarPdfBlob } from '@/services/avaliacaoDiagnosticaService'

function dispararDownloadBlob(blob: Blob, nomeArquivo: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  window.URL.revokeObjectURL(url)
}

export async function baixarAvaliacaoDiagnosticaPdf(avaliacaoId: number): Promise<void> {
  const blob = await gerarPdfBlob(avaliacaoId)
  dispararDownloadBlob(blob, `avaliacao-diagnostica-${avaliacaoId}.pdf`)
}

export async function baixarAvaliacaoDiagnosticaWord(avaliacaoId: number): Promise<void> {
  const detalhe = await buscarAvaliacaoPorId(avaliacaoId)
  await downloadAvaliacaoDiagnosticaDocx(detalhe)
}
