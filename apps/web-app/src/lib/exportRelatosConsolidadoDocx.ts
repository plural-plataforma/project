import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { RelatoAtendimento } from '@/types/relatoAtendimento'

const LABEL_TIPO: Record<number, string> = {
  0: 'Normal',
  1: 'Cancelada',
  2: 'Reagendada',
}

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

  const header = ['Data', 'Aluno', 'Presença', 'Tipo', 'PAEE', 'Observações']
  const rows = ord.map((r) => {
    const dh = new Date(`${r.dataSessao}T12:00:00`).toLocaleDateString('pt-BR')
    return [
      dh,
      r.alunoNome,
      r.presencaPresente ? 'Presente' : 'Ausente',
      LABEL_TIPO[r.tipoOcorrencia] ?? String(r.tipoOcorrencia),
      r.planejamentoApelido ?? '—',
      (r.observacoes ?? '').replace(/\s+/g, ' ').trim() || '—',
    ]
  })

  const tableRows = [
    new TableRow({
      children: header.map(
        (cell) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: cell, bold: true, size: 18 })] })],
          }),
      ),
    }),
    ...rows.map(
      (cols) =>
        new TableRow({
          children: cols.map(
            (text) =>
              new TableCell({
                width: { size: 2000, type: WidthType.DXA },
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
