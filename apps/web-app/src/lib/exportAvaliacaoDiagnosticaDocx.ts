import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx'
import type { AvaliacaoDiagnosticaDetalhada } from '@/types/avaliacao-diagnostica'
import dayjs from 'dayjs'

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'avaliacao'
}

function paragrafo(texto: string, opts?: { bold?: boolean; size?: number; spacingAfter?: number }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: texto.length > 0 ? texto : ' ',
        bold: opts?.bold,
        size: opts?.size ?? 22,
      }),
    ],
    spacing: { after: opts?.spacingAfter ?? 120 },
  })
}

/** Gera .docx editável com o conteúdo da avaliação diagnóstica (estrutura alinhada ao PDF da API). */
export async function downloadAvaliacaoDiagnosticaDocx(
  avaliacao: AvaliacaoDiagnosticaDetalhada
): Promise<void> {
  const blocos = [...(avaliacao.blocosComAtividades ?? [])].sort(
    (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
  )

  const children: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'AVALIAÇÃO DIAGNÓSTICA — PLURAL',
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    paragrafo(avaliacao.titulo, { bold: true, size: 26, spacingAfter: 240 }),
    paragrafo(`Objetivo: ${avaliacao.objetivo?.trim() || '—'}`),
    paragrafo(
      `Data de aplicação: ${
        avaliacao.dataAplicacao ? dayjs(avaliacao.dataAplicacao).format('DD/MM/YYYY') : '—'
      }`
    ),
  ]

  const escolaNome = avaliacao.escolaNome ?? avaliacao.escola?.nome
  if (escolaNome) {
    children.push(paragrafo(`Escola: ${escolaNome}`))
  }

  const perfis = avaliacao.perfisAutonomiaPorAluno ?? []
  if (perfis.length > 0) {
    children.push(paragrafo('Perfil de autonomia por aluno', { bold: true, size: 24, spacingAfter: 180 }))
    children.push(
      paragrafo(
        'Visão agregada a partir dos níveis registrados por atividade. Sugestões apoiam o planejamento PAEE.',
        { size: 20 }
      )
    )
    for (const perfil of [...perfis].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto))) {
      children.push(paragrafo(`${perfil.nomeCompleto}`, { bold: true, spacingAfter: 60 }))
      children.push(paragrafo(perfil.rotuloExibicao, { size: 20, spacingAfter: 60 }))
      children.push(paragrafo(`Sugestão PAEE: ${perfil.sugestaoPaee}`, { size: 20, spacingAfter: 60 }))
      if (perfil.habilidadesAReenforcar?.trim()) {
        children.push(
          paragrafo(`Habilidades a reforçar: ${perfil.habilidadesAReenforcar.trim()}`, {
            size: 20,
            spacingAfter: 60,
          })
        )
      }
      if (perfil.habilidadesFortes?.trim()) {
        children.push(
          paragrafo(`Habilidades fortes: ${perfil.habilidadesFortes.trim()}`, {
            size: 20,
            spacingAfter: 200,
          })
        )
      } else {
        children.push(paragrafo(' ', { size: 20, spacingAfter: 140 }))
      }
    }
  }

  children.push(paragrafo('Atividades', { bold: true, size: 24, spacingAfter: 200 }))

  for (const bloco of blocos) {
    children.push(
      paragrafo(`${bloco.ordem ?? ''} — ${bloco.titulo}`, { bold: true, size: 23, spacingAfter: 100 })
    )
    if (bloco.observacao?.trim()) {
      children.push(paragrafo(`Observação: ${bloco.observacao.trim()}`, { size: 20, spacingAfter: 120 }))
    }
    for (const atv of bloco.atividades ?? []) {
      children.push(paragrafo(`• ${atv.titulo}`, { bold: true, spacingAfter: 80 }))
      if (atv.imagemUrl?.trim()) {
        children.push(paragrafo(`Imagem: ${atv.imagemUrl.trim()}`, { size: 20, spacingAfter: 80 }))
      }
      if (atv.enunciado?.trim()) {
        children.push(paragrafo(atv.enunciado.trim(), { spacingAfter: 160 }))
      }
    }
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Gerado em ${dayjs().format('DD/MM/YYYY HH:mm')}`,
          italics: true,
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    })
  )

  const doc = new Document({
    creator: 'Plural Plataforma',
    title: avaliacao.titulo,
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
  const nomeBase = slugArquivoPart(avaliacao.titulo)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `AvaliacaoDiagnostica_${nomeBase}.docx`
  link.click()
  window.URL.revokeObjectURL(url)
}
