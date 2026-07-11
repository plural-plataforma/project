import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from 'docx'
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

function quebraPagina(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  })
}

type ImagemDocx = { data: Uint8Array; type: 'png' | 'jpg' | 'gif' | 'bmp' }

function tipoImagemPorUrl(url: string, contentType?: string | null): ImagemDocx['type'] {
  const ct = (contentType ?? '').toLowerCase()
  if (ct.includes('png')) return 'png'
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('gif')) return 'gif'
  if (ct.includes('bmp')) return 'bmp'
  const lower = url.toLowerCase()
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpg'
  if (lower.endsWith('.gif')) return 'gif'
  if (lower.endsWith('.bmp')) return 'bmp'
  return 'jpg'
}

async function buscarImagem(url: string): Promise<ImagemDocx | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = new Uint8Array(await response.arrayBuffer())
    if (data.length === 0) return null
    return { data, type: tipoImagemPorUrl(url, response.headers.get('content-type')) }
  } catch {
    return null
  }
}

function temResultadosDesempenho(avaliacao: AvaliacaoDiagnosticaDetalhada): boolean {
  return (avaliacao.registrosDesempenho?.length ?? 0) > 0
}

function perfisComResultado(avaliacao: AvaliacaoDiagnosticaDetalhada) {
  return [...(avaliacao.perfisAutonomiaPorAluno ?? [])]
    .filter((p) => p.nivelPerfilAutonomia !== 'NaoAvaliado')
    .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto))
}

/** Gera .docx editável: capa + uma atividade por página (imagem em destaque). Resultados só após lançamentos. */
export async function downloadAvaliacaoDiagnosticaDocx(
  avaliacao: AvaliacaoDiagnosticaDetalhada
): Promise<void> {
  const blocos = [...(avaliacao.blocosComAtividades ?? [])].sort(
    (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
  )

  const imagensPorUrl = new Map<string, ImagemDocx | null>()
  const urls = blocos.flatMap((b) =>
    (b.atividades ?? [])
      .map((a) => a.imagemUrl?.trim())
      .filter((url): url is string => !!url)
  )

  await Promise.all(
    [...new Set(urls)].map(async (url) => {
      imagensPorUrl.set(url, await buscarImagem(url))
    })
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

  const alunos = [...(avaliacao.alunosParticipantes ?? [])].sort((a, b) =>
    (a.aluno?.nomeCompleto ?? '').localeCompare(b.aluno?.nomeCompleto ?? '', 'pt-BR')
  )
  if (alunos.length > 0) {
    children.push(paragrafo('Alunos', { bold: true, spacingAfter: 80 }))
    for (const ap of alunos) {
      children.push(paragrafo(`• ${ap.aluno?.nomeCompleto ?? '—'}`, { size: 20, spacingAfter: 60 }))
    }
  }

  children.push(
    paragrafo('Atividades para aplicação', { bold: true, size: 24, spacingAfter: 120 }),
    paragrafo(
      'Cada atividade está em uma página seguinte, com imagem em destaque. Registre o desempenho na plataforma após aplicar com o(s) aluno(s).',
      { size: 20, spacingAfter: 200 }
    )
  )

  for (const bloco of blocos) {
    children.push(
      paragrafo(`${bloco.ordem ?? ''} — ${bloco.titulo}`, { bold: true, size: 22, spacingAfter: 80 })
    )
    for (const atv of bloco.atividades ?? []) {
      children.push(paragrafo(`• ${atv.titulo}`, { size: 20, spacingAfter: 60 }))
    }
  }

  for (const bloco of blocos) {
    for (const atv of bloco.atividades ?? []) {
      children.push(quebraPagina())
      children.push(
        paragrafo(`${bloco.ordem ?? ''} — ${bloco.titulo}`, {
          bold: true,
          size: 23,
          spacingAfter: 100,
        })
      )
      if (bloco.observacao?.trim()) {
        children.push(
          paragrafo(`Observação do eixo: ${bloco.observacao.trim()}`, { size: 20, spacingAfter: 120 })
        )
      }
      children.push(paragrafo(atv.titulo, { bold: true, spacingAfter: 160 }))

      const url = atv.imagemUrl?.trim()
      if (url) {
        const img = imagensPorUrl.get(url)
        if (img) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new ImageRun({
                  data: img.data,
                  type: img.type,
                  transformation: { width: 420, height: 420 },
                }),
              ],
            })
          )
        } else {
          children.push(paragrafo('(Imagem não disponível)', { size: 20, spacingAfter: 160 }))
        }
      }

      if (atv.enunciado?.trim()) {
        children.push(paragrafo(atv.enunciado.trim(), { spacingAfter: 160 }))
      }
    }
  }

  const perfis = perfisComResultado(avaliacao)
  if (temResultadosDesempenho(avaliacao) && perfis.length > 0) {
    children.push(quebraPagina())
    children.push(paragrafo('Resultados — Perfil de autonomia por aluno', { bold: true, size: 24, spacingAfter: 180 }))
    children.push(
      paragrafo(
        'Visão agregada a partir dos níveis registrados por atividade. Sugestões apoiam o planejamento PAEE.',
        { size: 20, spacingAfter: 200 }
      )
    )
    for (const perfil of perfis) {
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
