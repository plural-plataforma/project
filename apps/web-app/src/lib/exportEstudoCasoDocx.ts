import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx'
import { sanitizarTextoEstudoCaso } from '@/lib/sanitizarTextoEstudoCaso'

export interface ExportEstudoCasoDocxParams {
  tituloEstudo: string
  alunoNome: string
  textoCompleto: string
}

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'estudo_caso'
}

/**
 * As 4 etapas obrigatórias do Estudo de Caso, na ordem definida no system prompt
 * de geração por IA (ver PromptSistemaIA, tipo EstudoCaso — mesma lista usada em
 * EstudoCasoTextoIAViewer). O texto gerado é prosa corrida, um parágrafo por etapa.
 */
const ETAPAS_ESTUDO_CASO = [
  'Identificação inicial das demandas e barreiras',
  'Análise das barreiras e do contexto escolar',
  'Identificação das potencialidades e demandas de apoio',
  'Definição de estratégias e recursos para eliminação de barreiras',
]

const COR_AZUL = '1D3557'
const COR_CINZA = '666666'
const COR_AVISO = 'AA0000'
const FONTE_PADRAO = 'Calibri'

/** Converte o texto gerado por IA (prosa corrida, parágrafos separados por linha em branco) em Paragraphs do docx. */
function textoParaParagrafos(textoCompleto: string, alunoNome: string, tituloEstudo: string): Paragraph[] {
  const paragrafosTexto = textoCompleto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const mapeiaEtapas = paragrafosTexto.length === ETAPAS_ESTUDO_CASO.length

  const paragrafos: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: 'ESTUDO DE CASO — AEE', bold: true, size: 28, color: COR_AZUL, font: FONTE_PADRAO }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: tituloEstudo, bold: true, size: 24, color: COR_AZUL, font: FONTE_PADRAO }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Estudante: ${alunoNome}`, italics: true, size: 18, color: COR_CINZA, font: FONTE_PADRAO }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Documento gerado por Inteligência Artificial (beta) — revise antes de uso oficial.',
          italics: true,
          color: COR_AVISO,
          size: 16,
          font: FONTE_PADRAO,
        }),
      ],
      spacing: { after: 240 },
    }),
  ]

  paragrafosTexto.forEach((paragrafo, idx) => {
    if (mapeiaEtapas) {
      paragrafos.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${ETAPAS_ESTUDO_CASO[idx]}`,
              bold: true,
              size: 24,
              color: COR_AZUL,
              font: FONTE_PADRAO,
            }),
          ],
          spacing: { before: 320, after: 120 },
        })
      )
    }

    paragrafos.push(
      new Paragraph({
        children: [new TextRun({ text: paragrafo, size: 22, font: FONTE_PADRAO })],
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: convertInchesToTwip(0.15) },
        spacing: { after: 200 },
      })
    )
  })

  return paragrafos
}

/** Gera um .docx formatado conforme o template AEE definitivo. */
export async function downloadEstudoCasoDocx(params: ExportEstudoCasoDocxParams): Promise<void> {
  const children = textoParaParagrafos(
    sanitizarTextoEstudoCaso(params.textoCompleto),
    params.alunoNome,
    params.tituloEstudo
  )

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
