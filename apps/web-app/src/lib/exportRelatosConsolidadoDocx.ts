import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { RelatoAtendimento } from '@/types/relatoAtendimento'

export interface ExportRelatosConsolidadoParams {
  dataInicio: string
  dataFim: string
  itens: RelatoAtendimento[]
}

/** Relatório editável agrupando relatos já filtrados (período e opcionalmente aluno). */
export async function downloadRelatosConsolidadoDocx(params: ExportRelatosConsolidadoParams): Promise<void> {
  const ini = new Date(`${params.dataInicio}T12:00:00`).toLocaleDateString('pt-BR')
  const fim = new Date(`${params.dataFim}T12:00:00`).toLocaleDateString('pt-BR')
  const ord = [...params.itens].sort((a, b) => {
    const c = a.dataSessao.localeCompare(b.dataSessao)
    return c !== 0 ? c : a.alunoNome.localeCompare(b.alunoNome)
  })

  const header = ['Data', 'Aluno', 'Presença', 'PAEE', 'Detalhes do atendimento']
  const rows = ord.map((r) => {
    const dh = new Date(`${r.dataSessao}T12:00:00`).toLocaleDateString('pt-BR')
    const detalhes = r.textoGeradoIA?.trim()
      ? r.textoGeradoIA.trim().replace(/\s+/g, ' ')
      : [
          r.observacoes?.trim(),
          r.avancos?.length ? `Avanços: ${r.avancos.join('; ')}` : '',
          r.dificuldades?.length ? `Dificuldades: ${r.dificuldades.join('; ')}` : '',
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
    return [
      dh,
      r.alunoNome,
      r.presencaPresente ? 'Presente' : 'Ausente',
      r.planejamentoApelido ?? '—',
      detalhes || '—',
    ]
  })

  // Larguras proporcionais por coluna (soma 10000 DXA = largura da tabela).
  // "Detalhes do atendimento" recebe a maior parte — passou a conter parágrafo
  // corrido de IA, não mais um texto curto concatenado.
  const colunaLarguras = [1300, 1800, 1100, 1600, 4200]

  const tableRows = [
    new TableRow({
      children: header.map(
        (cell, i) =>
          new TableCell({
            width: { size: colunaLarguras[i], type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: cell, bold: true, size: 18 })] })],
          }),
      ),
    }),
    ...rows.map(
      (cols) =>
        new TableRow({
          children: cols.map(
            (text, i) =>
              new TableCell({
                width: { size: colunaLarguras[i], type: WidthType.DXA },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: text.length ? text : ' ', size: 18 })],
                  }),
                ],
              }),
          ),
        }),
    ),
  ]

  const doc = new Document({
    creator: 'Plural Plataforma',
    title: 'Relatório de relatos de atendimento',
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: 'RELATÓRIOS DE ATENDIMENTO (consolidado)',
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [new TextRun({ text: `Período: ${ini} até ${fim}`, size: 22 })],
          }),
          new Paragraph({
            spacing: { after: 180 },
            children: [new TextRun({ text: `Total de registros: ${ord.length}`, size: 22 })],
          }),
          ...(ord.length === 0
            ? [
                new Paragraph({
                  spacing: { after: 400 },
                  children: [
                    new TextRun({
                      text: 'Nenhum relato neste período.',
                      italics: true,
                      color: '666666',
                    }),
                  ],
                }),
              ]
            : [
                new Table({
                  width: { size: 10000, type: WidthType.DXA },
                  columnWidths: colunaLarguras,
                  layout: TableLayoutType.FIXED,
                  rows: tableRows,
                }),
                new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: ' ', size: 8 })] }),
              ]),
          new Paragraph({
            children: [
              new TextRun({
                text: `Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                size: 18,
                color: '777777',
              }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const slugIni = params.dataInicio.replace(/-/g, '')
  const slugFim = params.dataFim.replace(/-/g, '')
  link.download = `Relatos_atendimento_${slugIni}_${slugFim}.docx`
  link.click()
  URL.revokeObjectURL(url)
}
