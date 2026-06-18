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
  type IFileChild,
  type ParagraphChild,
  type Paragraph as ParagraphType,
} from 'docx'
import type { Planejamento } from '@/types/planejamento'
import type { Aluno } from '@/types/aluno'
import { formatOrganizacaoAtendimentoAluno } from '@/lib/paeeExportHelpers'

export interface ExportPaeePlanejamentoDocxParams {
  planejamento: Planejamento
  /** Dados completos do aluno quando export com um único vínculo. */
  alunoAtendimento?: Aluno | null
  /** Opcional — ex.: laudos quando exportado com dados agregados. */
  textoDiagnosticoMedicoOpcional?: string
}

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'paee'
}

function bulletParagraph(texto: string): ParagraphType {
  return new Paragraph({
    children: [new TextRun({ text: `• ${texto}`, size: 22 })],
    indent: { left: 560 },
    spacing: { after: 160 },
  })
}

function textoObj(t?: string | null) {
  return (t ?? '').trim().length > 0 ? (t ?? '') : '(não preenchido)'
}

function sortNomes(list: string[]) {
  return [...list].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function labelHabilidade(plan: Planejamento, id?: number | null): string {
  if (id == null) return '—'
  const h = plan.habilidades?.find((x) => x.id === id)
  return h?.resumo || h?.descricao || String(id)
}

function labelEstrategia(plan: Planejamento, id?: number | null): string {
  if (id == null) return '—'
  const e = plan.estrategias?.find((x) => x.id === id)
  return e?.descricao || String(id)
}

/** Gera `.docx` editável com período do PAEE, objetivos CM/L, vínculos e grade de encontros. */
export async function downloadPaeePlanejamentoDocx(params: ExportPaeePlanejamentoDocxParams): Promise<void> {
  const p = params.planejamento
  const nomeArquivoSlug = slugArquivoPart(p.apelido)
  const nomesAlunos = sortNomes(
    [...(p.alunos ?? []).map((a) => (a.nomeCompleto ?? '').trim()).filter(Boolean)]
  )

  const textoOrganizacao =
    nomesAlunos.length > 1
      ? 'Vários alunos vinculados — frequência, dias e duração: consultar cadastro individual de cada aluno.'
      : nomesAlunos.length === 1 && params.alunoAtendimento
        ? formatOrganizacaoAtendimentoAluno(params.alunoAtendimento)
        : nomesAlunos.length === 1
          ? 'Frequência e dias na rotina escolar: conferir cadastro do aluno.'
          : 'Frequência: informar quando houver aluno(s) vinculado(s).'

  const identificaçãoLinhas =
    nomesAlunos.length === 0
      ? ['Nenhum aluno vinculado no momento do export.']
      : nomesAlunos.map((nome) => `• ${nome}`)

  const periodoInicio = p.dataInicio
    ? new Date(`${p.dataInicio}T12:00:00`).toLocaleDateString('pt-BR')
    : '___'
  const periodoFim = p.dataFim
    ? new Date(`${p.dataFim}T12:00:00`).toLocaleDateString('pt-BR')
    : '___'

  const diagnosticText =
    params.textoDiagnosticoMedicoOpcional?.trim() ||
    'Não incluído neste export. Consulte cadastro ou exporte pelo perfil do aluno.'

  const encontrosSorted = [...(p.encontros ?? [])].sort((a, b) => {
    const c = String(a.dataEnc).localeCompare(String(b.dataEnc))
    return c !== 0 ? c : a.id - b.id
  })

  const enHeaders = ['Data', 'Planejado', 'Habilidade', 'Estratégia']
  const rows = encontrosSorted.map((e) => {
    const dh = new Date(`${e.dataEnc}T12:00:00`).toLocaleDateString('pt-BR')
    return [
      dh,
      (e.textoPlanejado ?? '').trim().length ? (e.textoPlanejado ?? '') : '—',
      labelHabilidade(p, e.habilidadeId),
      labelEstrategia(p, e.estrategiaId),
    ]
  })

  const children: IFileChild[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'PLANO DE ATENDIMENTO EDUCACIONAL ESPECIALIZADO (PAEE)',
          bold: true,
          size: 36,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [new TextRun({ text: p.apelido, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '1. IDENTIFICAÇÃO DO(A) ALUNO(A):', bold: true, size: 26 })],
      spacing: { after: 200 },
    }),
    ...identificaçãoLinhas.map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: line.startsWith('•') ? 120 : 200 },
          indent: line.startsWith('•') ? { left: 360 } : undefined,
        }),
    ),
    new Paragraph({
      children: [
        new TextRun('Diagnóstico médico (resumo): '),
        new TextRun({ text: diagnosticText, italics: true }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '2. PERÍODO E ORGANIZAÇÃO DO ATENDIMENTO:', bold: true, size: 26 })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun(`Período do PAEE: ${periodoInicio} até ${periodoFim}`)],
      spacing: { after: 220 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: textoOrganizacao,
        }),
      ],
      spacing: { after: 420 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '3. OBJETIVOS CURTO / MÉDIO / LONGO PRAZO:', bold: true, size: 26 }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Curto prazo:', bold: true }),
        new TextRun({ text: ` ${textoObj(p.objetivoCurtoPrazo)}`, size: 22 }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Médio prazo:', bold: true }),
        new TextRun({ text: ` ${textoObj(p.objetivoMedioPrazo)}`, size: 22 }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Longo prazo:', bold: true }),
        new TextRun({ text: ` ${textoObj(p.objetivoLongoPrazo)}`, size: 22 }),
      ],
      spacing: { after: 440 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '4. OBJETIVOS RELACIONADOS ÀS HABILIDADES SELECIONADAS:',
          bold: true,
          size: 26,
        }),
      ],
      spacing: { after: 220 },
    }),
    ...(p.habilidades?.length
      ? p.habilidades.map((h) => bulletParagraph(h.descricao || h.resumo || `Habilidade ${h.id}`))
      : ([
          new Paragraph({
            children: [
              new TextRun({ text: '• Nenhuma habilidade vinculada.', italics: true, color: '666666' }),
            ],
            indent: { left: 560 },
            spacing: { after: 260 },
          }),
        ] as IFileChild[])),
    new Paragraph({ spacing: { after: 360 } }),
    new Paragraph({
      children: [new TextRun({ text: '5. ESTRATÉGIAS A SEREM UTILIZADAS:', bold: true, size: 26 })],
      spacing: { after: 220 },
    }),
    ...(p.estrategias?.length
      ? p.estrategias.map((e) => bulletParagraph(e.descricao))
      : ([
          new Paragraph({
            children: [
              new TextRun({ text: '• Nenhuma estratégia cadastrada.', italics: true, color: '666666' }),
            ],
            indent: { left: 560 },
            spacing: { after: 260 },
          }),
        ] as IFileChild[])),
    new Paragraph({
      children: [new TextRun({ text: '6. CRITÉRIOS AVALIATIVOS:', bold: true, size: 26 })],
      spacing: { after: 220 },
    }),
    ...(p.avaliacao?.length
      ? p.avaliacao.map((av) => bulletParagraph(av.descricao))
      : ([
          new Paragraph({
            children: [
              new TextRun({ text: '• Nenhum critério cadastrado.', italics: true, color: '666666' }),
            ],
            indent: { left: 560 },
            spacing: { after: 260 },
          }),
        ] as IFileChild[])),
    new Paragraph({ spacing: { after: 460 } }),
    new Paragraph({
      children: [new TextRun({ text: '7. ENCONTROS:', bold: true, size: 26 })],
      spacing: { after: 240 },
    }),
  ]

  if (rows.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Nenhum encontro registrado.', italics: true, color: '666666' }),
        ],
        spacing: { after: 400 },
      })
    )
  } else {
    const colWidths = [1200, 4000, 2800, 3200]
    const headerRow = new TableRow({
      children: enHeaders.map(
        (cell, ix) =>
          new TableCell({
            width: { size: colWidths[ix], type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: cell, bold: true, size: 18 })],
              }),
            ],
          })
      ),
    })
    const dataRows = rows.map(
      (cols) =>
        new TableRow({
          children: cols.map(
            (text, ix) =>
              new TableCell({
                width: { size: colWidths[ix], type: WidthType.DXA },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: text.length ? text : ' ', size: 18 })],
                  }),
                ],
              })
          ),
        })
    )

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: colWidths,
        rows: [headerRow, ...dataRows],
      })
    )

    children.push(
      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({ text: ' ', size: 8 })],
      })
    )
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          size: 18,
          color: '777777',
        }),
      ],
      spacing: { before: 360 },
    })
  )

  const doc = new Document({
    creator: 'Plural Plataforma',
    title: `PAEE — ${p.apelido}`,
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: children as ParagraphChild[],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `PAEE_${nomeArquivoSlug}.docx`
  link.click()
  URL.revokeObjectURL(url)
}
