import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx'

export interface ExportEstudoCasoDocxParams {
  tituloEstudo: string
  alunoNome: string
  textoCompleto: string
}

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'estudo_caso'
}

/**
 * Classifica uma linha do texto gerado pelo backend para aplicar a formatação correta.
 * O backend gera texto com marcadores semânticos que seguem o template AEE.
 */
function classificarLinha(
  line: string
): 'aviso' | 'titulo-doc' | 'subtitulo' | 'metadados' | 'secao' | 'subsecao' | 'bullet' | 'divisor' | 'vazio' | 'corpo' {
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
  // Linha imediatamente após o cabeçalho "ESTUDO DE CASO" — é o título do estudo
  return 'corpo'
}

const COR_AZUL = '1D3557'
const COR_CINZA = '666666'
const COR_AVISO = 'AA0000'
const FONTE_PADRAO = 'Calibri'

/** Converte `textoCompleto` gerado pelo backend em lista de Paragraphs do docx. */
function textoParaParagrafos(textoCompleto: string): Paragraph[] {
  const linhas = textoCompleto.split(/\r?\n/)
  const paragrafos: Paragraph[] = []

  // Detecta se a linha logo após "ESTUDO DE CASO" é o subtítulo do estudo
  let proximaESubtitulo = false

  for (const linha of linhas) {
    const tipo = classificarLinha(linha)
    const t = linha.trim()

    switch (tipo) {
      case 'vazio':
        paragrafos.push(new Paragraph({ spacing: { after: 80 } }))
        proximaESubtitulo = false
        break

      case 'aviso':
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                italics: true,
                color: COR_AVISO,
                size: 16,
                font: FONTE_PADRAO,
              }),
            ],
            spacing: { after: 160 },
          })
        )
        proximaESubtitulo = false
        break

      case 'titulo-doc':
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                bold: true,
                size: 28,
                color: COR_AZUL,
                font: FONTE_PADRAO,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          })
        )
        proximaESubtitulo = true
        break

      case 'subtitulo':
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                bold: true,
                size: 24,
                color: COR_AZUL,
                font: FONTE_PADRAO,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          })
        )
        proximaESubtitulo = false
        break

      case 'metadados':
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                italics: true,
                size: 18,
                color: COR_CINZA,
                font: FONTE_PADRAO,
              }),
            ],
            spacing: { after: 60 },
          })
        )
        break

      case 'secao':
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                bold: true,
                size: 24,
                color: COR_AZUL,
                font: FONTE_PADRAO,
              }),
            ],
            spacing: { before: 320, after: 120 },
          })
        )
        proximaESubtitulo = false
        break

      case 'subsecao':
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                bold: true,
                size: 22,
                font: FONTE_PADRAO,
              }),
            ],
            spacing: { before: 160, after: 60 },
          })
        )
        break

      case 'bullet':
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                size: 22,
                font: FONTE_PADRAO,
              }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
            spacing: { after: 60 },
          })
        )
        break

      case 'divisor':
        paragrafos.push(
          new Paragraph({
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: 'CCCCCC',
                space: 4,
              },
            },
            spacing: { after: 120 },
          })
        )
        break

      default: {
        // 'corpo' ou subtítulo do estudo (linha após "ESTUDO DE CASO")
        const eSubtitulo = proximaESubtitulo && tipo === 'corpo'
        if (eSubtitulo) proximaESubtitulo = false
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: t,
                bold: eSubtitulo,
                size: eSubtitulo ? 24 : 22,
                color: eSubtitulo ? COR_AZUL : undefined,
                font: FONTE_PADRAO,
              }),
            ],
            alignment: eSubtitulo ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            spacing: { after: eSubtitulo ? 80 : 100 },
          })
        )
      }
    }
  }

  return paragrafos
}

/** Gera um .docx formatado conforme o template AEE definitivo. */
export async function downloadEstudoCasoDocx(params: ExportEstudoCasoDocxParams): Promise<void> {
  const children = textoParaParagrafos(params.textoCompleto)

  const doc = new Document({
    creator: 'Plural Plataforma',
    title: params.tituloEstudo,
    description: `Estudo de caso — ${params.alunoNome}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const nomeBase = slugArquivoPart(params.tituloEstudo)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `EstudoCaso_${nomeBase}.docx`
  link.click()
  window.URL.revokeObjectURL(url)
}
