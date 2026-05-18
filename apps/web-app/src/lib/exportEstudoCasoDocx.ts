import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx'

export interface ExportEstudoCasoDocxParams {
  /** Título do estudo de caso (capa). */
  tituloEstudo: string
  /** Nome do aluno para linha de identificação na capa. */
  alunoNome: string
  /** Texto completo retornado pela API (inclui cabeçalhos e corpo). */
  textoCompleto: string
}

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'estudo_caso'
}

/** Gera um .docx editável com o rascunho do estudo de caso (mesmo padrão do export PAEE no perfil). */
export async function downloadEstudoCasoDocx(params: ExportEstudoCasoDocxParams): Promise<void> {
  const linhas = params.textoCompleto.split(/\r?\n/)
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'ESTUDO DE CASO — PLURAL (RASCUNHO SIMULADO)',
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    new Paragraph({
      children: [new TextRun({ text: params.tituloEstudo, bold: true, size: 26 })],
      spacing: { after: 180 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Aluno(a): ${params.alunoNome}`, size: 22 })],
      spacing: { after: 400 },
    }),
    ...linhas.map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line.length > 0 ? line : ' ', size: 22 })],
          spacing: { after: line.trim() === '' ? 100 : 60 },
        })
    ),
  ]

  const doc = new Document({
    creator: 'Plural Plataforma',
    title: params.tituloEstudo,
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
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
