import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx'
import { downloadPaeePlanejamentoDocx } from '@/lib/exportPaeePlanejamentoDocx'
import { baixarEstudoCasoWord } from '@/lib/baixarEstudoCaso'
import { sanitizarTextoEstudoCaso } from '@/lib/sanitizarTextoEstudoCaso'
import { buscarPlanejamentoPorId } from '@/services/planejamentoService'
import { buscarEstudoCasoPorId, gerarTextoSimuladoEstudoCaso } from '@/services/estudoCasoService'
import type { Planejamento } from '@/types/planejamento'

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'documentacao'
}

/** Capa única + estudo de caso; em seguida baixa o PAEE em arquivo separado. */
export async function baixarFusaoEstudoCasoPaee(params: {
  estudoId: number
  planejamentoId: number
  alunoNome: string
}): Promise<void> {
  let detalhe = await buscarEstudoCasoPorId(params.estudoId)
  if (!detalhe.textoSimulado?.trim()) {
    detalhe = await gerarTextoSimuladoEstudoCaso(params.estudoId)
  }
  const textoEstudo = sanitizarTextoEstudoCaso(detalhe.textoSimulado?.trim() ?? '')
  if (!textoEstudo) throw new Error('Estudo de caso sem texto para download.')

  const plano: Planejamento = await buscarPlanejamentoPorId(params.planejamentoId)

  const linhasEstudo = textoEstudo.split(/\r?\n/)
  const capa = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'DOCUMENTAÇÃO PEDAGÓGICA — ESTUDO DE CASO + PAEE',
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Aluno(a): ${params.alunoNome}`, size: 24, bold: true })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Estudo de caso: ${detalhe.titulo} · PAEE: ${plano.apelido}`,
          size: 22,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'PARTE 1 — ESTUDO DE CASO', bold: true, size: 26 })],
      spacing: { after: 240 },
    }),
    ...linhasEstudo.map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line.length > 0 ? line : ' ', size: 22 })],
          spacing: { after: line.trim() === '' ? 100 : 60 },
        })
    ),
    new Paragraph({
      children: [
        new TextRun({
          text: 'PARTE 2 — PAEE: será baixado em arquivo Word complementar nesta mesma ação.',
          italics: true,
          size: 20,
        }),
      ],
      spacing: { before: 400, after: 200 },
    }),
  ]

  const doc = new Document({
    creator: 'Plural Plataforma',
    title: `Documentação — ${params.alunoNome}`,
    sections: [{ children: capa }],
  })

  const blob = await Packer.toBlob(doc)
  const slug = slugArquivoPart(params.alunoNome)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Documentacao_EstudoCaso_${slug}.docx`
  link.click()
  URL.revokeObjectURL(url)

  await new Promise((resolve) => setTimeout(resolve, 350))
  await downloadPaeePlanejamentoDocx({ planejamento: plano })
}
