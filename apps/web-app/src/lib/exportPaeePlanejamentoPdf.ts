import { jsPDF } from 'jspdf'
import type { Planejamento } from '@/types/planejamento'
import type { Aluno } from '@/types/aluno'
import { formatOrganizacaoAtendimentoAluno } from '@/lib/paeeExportHelpers'

export interface ExportPaeePlanejamentoPdfParams {
  planejamento: Planejamento
  alunoAtendimento?: Aluno | null
}

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'paee'
}

function textoObj(t?: string | null): string {
  return (t ?? '').trim().length > 0 ? (t ?? '') : '(não preenchido)'
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

function addSection(doc: jsPDF, title: string, y: number, margin: number, maxW: number): number {
  if (y > 250) {
    doc.addPage()
    y = 18
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  const linhas = doc.splitTextToSize(title, maxW)
  doc.text(linhas, margin, y)
  return y + linhas.length * 6 + 4
}

function addParagraph(doc: jsPDF, text: string, y: number, margin: number, maxW: number): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const linhas = doc.splitTextToSize(text, maxW)
  const pageH = doc.internal.pageSize.getHeight()
  for (const linha of linhas) {
    if (y > pageH - 20) {
      doc.addPage()
      y = 18
    }
    doc.text(linha, margin, y)
    y += 5
  }
  return y + 4
}

/** PDF texto com estrutura alinhada ao Word/aba Encontros. */
export function downloadPaeePlanejamentoPdf(params: ExportPaeePlanejamentoPdfParams): void {
  const p = params.planejamento
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const margin = 16
  const pageW = doc.internal.pageSize.getWidth()
  const maxW = pageW - margin * 2
  let y = margin

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PLANO DE ATENDIMENTO EDUCACIONAL ESPECIALIZADO (PAEE)', margin, y, { maxWidth: maxW })
  y += 10
  doc.setFontSize(12)
  doc.text(p.apelido, margin, y, { maxWidth: maxW })
  y += 12

  const periodoInicio = p.dataInicio
    ? new Date(`${p.dataInicio}T12:00:00`).toLocaleDateString('pt-BR')
    : '—'
  const periodoFim = p.dataFim
    ? new Date(`${p.dataFim}T12:00:00`).toLocaleDateString('pt-BR')
    : '—'

  y = addSection(doc, '1. IDENTIFICAÇÃO DO(A) ALUNO(A)', y, margin, maxW)
  const nomes = (p.alunos ?? []).map((a) => a.nomeCompleto).filter(Boolean)
  y = addParagraph(doc, nomes.length ? nomes.map((n) => `• ${n}`).join('\n') : 'Nenhum aluno vinculado.', y, margin, maxW)

  y = addSection(doc, '2. PERÍODO E ORGANIZAÇÃO DO ATENDIMENTO', y, margin, maxW)
  y = addParagraph(doc, `Período do PAEE: ${periodoInicio} até ${periodoFim}`, y, margin, maxW)
  const textoOrg =
    nomes.length > 1
      ? 'Vários alunos vinculados — consultar cadastro individual.'
      : nomes.length === 1 && params.alunoAtendimento
        ? formatOrganizacaoAtendimentoAluno(params.alunoAtendimento)
        : nomes.length === 1
          ? 'Conferir cadastro do aluno para frequência e dias.'
          : 'Informar quando houver aluno(s) vinculado(s).'
  y = addParagraph(doc, textoOrg, y, margin, maxW)

  y = addSection(doc, '3. OBJETIVOS CURTO / MÉDIO / LONGO PRAZO', y, margin, maxW)
  y = addParagraph(doc, `Curto prazo: ${textoObj(p.objetivoCurtoPrazo)}`, y, margin, maxW)
  y = addParagraph(doc, `Médio prazo: ${textoObj(p.objetivoMedioPrazo)}`, y, margin, maxW)
  y = addParagraph(doc, `Longo prazo: ${textoObj(p.objetivoLongoPrazo)}`, y, margin, maxW)

  y = addSection(doc, '4. OBJETIVOS RELACIONADOS ÀS HABILIDADES', y, margin, maxW)
  y = addParagraph(
    doc,
    p.habilidades?.length
      ? p.habilidades.map((h) => `• ${h.descricao || h.resumo || h.id}`).join('\n')
      : 'Nenhuma habilidade vinculada.',
    y,
    margin,
    maxW
  )

  y = addSection(doc, '5. ESTRATÉGIAS A SEREM UTILIZADAS', y, margin, maxW)
  y = addParagraph(
    doc,
    p.estrategias?.length
      ? p.estrategias.map((e) => `• ${e.descricao}`).join('\n')
      : 'Nenhuma estratégia vinculada.',
    y,
    margin,
    maxW
  )

  y = addSection(doc, '6. CRITÉRIOS AVALIATIVOS', y, margin, maxW)
  y = addParagraph(
    doc,
    p.avaliacao?.length
      ? p.avaliacao.map((a) => `• ${a.descricao}`).join('\n')
      : 'Nenhum critério vinculado.',
    y,
    margin,
    maxW
  )

  y = addSection(doc, '7. ENCONTROS', y, margin, maxW)
  const encontros = [...(p.encontros ?? [])].sort((a, b) => String(a.dataEnc).localeCompare(String(b.dataEnc)))
  if (encontros.length === 0) {
    y = addParagraph(doc, 'Nenhum encontro registrado.', y, margin, maxW)
  } else {
    for (const enc of encontros) {
      const dataFmt = new Date(`${enc.dataEnc}T12:00:00`).toLocaleDateString('pt-BR')
      const bloco = [
        `Data: ${dataFmt}`,
        `Planejado: ${(enc.textoPlanejado ?? '').trim() || '—'}`,
        `Realizado: ${(enc.textoRealizado ?? '').trim() || '—'}`,
        `Habilidade: ${labelHabilidade(p, enc.habilidadeId)}`,
        `Estratégia: ${labelEstrategia(p, enc.estrategiaId)}`,
      ].join('\n')
      y = addParagraph(doc, bloco, y, margin, maxW)
      y += 2
    }
  }

  y = addSection(doc, '8. ASSINATURA', y, margin, maxW)
  y = addParagraph(
    doc,
    [
      `Documento declarado assinado: ${p.documentoDeclaradoAssinado ? 'Sim' : 'Não'}`,
      `Responsável: ${(p.assinaturaNomeResponsavel ?? '').trim() || '(não informado)'}`,
      `Cargo: ${(p.assinaturaCargo ?? '').trim() || '(não informado)'}`,
    ].join('\n'),
    y,
    margin,
    maxW
  )

  y = addParagraph(
    doc,
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    y,
    margin,
    maxW
  )

  doc.save(`PAEE_${slugArquivoPart(p.apelido)}.pdf`)
}
