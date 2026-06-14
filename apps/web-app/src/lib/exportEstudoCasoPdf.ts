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

type TipoLinha =
  | 'aviso'
  | 'titulo-doc'
  | 'corpo-subtitulo'
  | 'metadados'
  | 'secao'
  | 'subsecao'
  | 'bullet'
  | 'divisor'
  | 'vazio'
  | 'corpo'

function classificarLinha(line: string, proximaESubtitulo: boolean): TipoLinha {
  const t = line.trim()
  if (!t) return 'vazio'
  if (t.startsWith('***')) return 'aviso'
  if (t.startsWith('ESTUDO DE CASO')) return 'titulo-doc'
  if (t === '---') return 'divisor'
  if (/^\d+\.\s/.test(t)) return 'secao'
  if (
    /^(Barreiras observadas|Potencialidades identificadas|Objetivos do AEE|Estratégias|Recursos|Encaminhamentos):/.test(
      t
    )
  )
    return 'subsecao'
  if (t.startsWith('•')) return 'bullet'
  if (t.startsWith('Estudante:') || t.startsWith('Escola:')) return 'metadados'
  if (proximaESubtitulo) return 'corpo-subtitulo'
  return 'corpo'
}

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

  const linhas = sanitizarTextoEstudoCaso(params.textoCompleto).split(/\r?\n/)
  let proximaESubtitulo = false

  for (const linha of linhas) {
    const tipo = classificarLinha(linha, proximaESubtitulo)
    const t = linha.trim()

    // Atualiza flag de subtítulo
    if (tipo === 'titulo-doc') {
      proximaESubtitulo = true
    } else if (tipo === 'corpo-subtitulo') {
      proximaESubtitulo = false
    } else if (tipo !== 'vazio') {
      proximaESubtitulo = false
    }

    switch (tipo) {
      case 'vazio':
        novaLinha(2.5)
        break

      case 'aviso': {
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...VERMELHO)
        const n = escreverTexto(t, marginL, y, { maxWidth: maxW })
        novaLinha(n * 4 + 3)
        doc.setTextColor(...PRETO)
        break
      }

      case 'titulo-doc': {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...AZUL)
        escreverTexto(t, pageW / 2, y, { align: 'center', maxWidth: maxW })
        novaLinha(8)
        doc.setTextColor(...PRETO)
        break
      }

      case 'corpo-subtitulo': {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...AZUL)
        escreverTexto(t, pageW / 2, y, { align: 'center', maxWidth: maxW })
        novaLinha(8)
        doc.setTextColor(...PRETO)
        break
      }

      case 'metadados': {
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...CINZA)
        const n = escreverTexto(t, marginL, y, { maxWidth: maxW })
        novaLinha(n * 4.5 + 2)
        doc.setTextColor(...PRETO)
        break
      }

      case 'secao': {
        // Garante espaço mínimo antes de iniciar nova seção
        if (y > pageH - marginB - 30) {
          doc.addPage()
          y = marginT
        } else {
          novaLinha(4)
        }
        doc.setFontSize(11.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...AZUL)
        const n = escreverTexto(t, marginL, y, { maxWidth: maxW })
        novaLinha(n * 6 + 3)
        doc.setTextColor(...PRETO)
        break
      }

      case 'subsecao': {
        novaLinha(2)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...PRETO)
        const n = escreverTexto(t, marginL, y, { maxWidth: maxW })
        novaLinha(n * 5.5 + 2)
        break
      }

      case 'bullet': {
        doc.setFontSize(9.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...PRETO)
        const n = escreverTexto(t, marginL + 3, y, { maxWidth: maxW - 3 })
        novaLinha(n * 5 + 2)
        break
      }

      case 'divisor': {
        novaLinha(2)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(marginL, y, pageW - marginR, y)
        novaLinha(5)
        break
      }

      default: {
        // 'corpo'
        doc.setFontSize(9.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...PRETO)
        const n = escreverTexto(t, marginL, y, { maxWidth: maxW })
        novaLinha(n * 5 + 2)
        break
      }
    }
  }

  doc.save(`EstudoCaso_${slugArquivoPart(params.tituloEstudo)}.pdf`)
}
