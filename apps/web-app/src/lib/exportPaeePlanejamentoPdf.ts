import { jsPDF } from 'jspdf'
import type { Planejamento } from '@/types/planejamento'
import type { Aluno } from '@/types/aluno'
import {
  calcularIdade,
  formatCargaHorariaSemanal,
  formatFrequenciaAtendimentos,
  formatOrganizacaoCheckbox,
} from '@/lib/paeeExportHelpers'

export interface ExportPaeePlanejamentoPdfParams {
  planejamento: Planejamento
  alunoAtendimento?: Aluno | null
  /** Nome da escola do aluno (resolvida a partir de idEscola). */
  nomeEscola?: string
  /** Nome do(a) professor(a) AEE responsável (professor logado). */
  nomeProfessorAee?: string
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

  const aluno = params.alunoAtendimento
  const nomes = (p.alunos ?? []).map((a) => a.nomeCompleto).filter(Boolean)

  y = addSection(doc, '1. IDENTIFICAÇÃO DO(A) ALUNO(A)', y, margin, maxW)
  if (nomes.length === 0) {
    y = addParagraph(doc, 'Nenhum aluno vinculado no momento do export.', y, margin, maxW)
  } else if (nomes.length > 1) {
    y = addParagraph(doc, nomes.map((n) => `• ${n}`).join('\n'), y, margin, maxW)
    y = addParagraph(
      doc,
      'Vários alunos vinculados — data de nascimento, idade, escola, organização, frequência e carga horária: consultar cadastro individual de cada aluno.',
      y,
      margin,
      maxW
    )
  } else {
    const dataNascimentoFmt = aluno?.dataNascimento
      ? new Date(`${aluno.dataNascimento}T12:00:00`).toLocaleDateString('pt-BR')
      : 'não informado'
    const campos = [
      `Nome do estudante: ${nomes[0]}`,
      `Data de nascimento: ${dataNascimentoFmt}`,
      `Idade: ${aluno ? calcularIdade(aluno.dataNascimento) : 'não informado'}`,
      `Ano/Turma: ${aluno?.ano?.trim() || 'não informado'}`,
      `Escola: ${params.nomeEscola?.trim() || 'não informado'}`,
      `Professor(a) do AEE: ${params.nomeProfessorAee?.trim() || 'não informado'}`,
      `Período avaliado: ${periodoInicio} até ${periodoFim}`,
      `Organização do atendimento: ${aluno ? formatOrganizacaoCheckbox(aluno) : '( ) Individual ( ) Grupo'}`,
      `Frequência dos atendimentos: ${aluno ? formatFrequenciaAtendimentos(aluno) : 'conferir cadastro do aluno'}`,
      `Carga horária: ${aluno ? formatCargaHorariaSemanal(aluno) : 'conferir cadastro do aluno'}`,
    ]
    y = addParagraph(doc, campos.join('\n'), y, margin, maxW)
  }
  y = addSection(doc, '2. OBJETIVOS CURTO / MÉDIO / LONGO PRAZO', y, margin, maxW)
  y = addParagraph(doc, `Curto prazo: ${textoObj(p.objetivoCurtoPrazo)}`, y, margin, maxW)
  y = addParagraph(doc, `Médio prazo: ${textoObj(p.objetivoMedioPrazo)}`, y, margin, maxW)
  y = addParagraph(doc, `Longo prazo: ${textoObj(p.objetivoLongoPrazo)}`, y, margin, maxW)

  y = addSection(doc, '3. OBJETIVOS RELACIONADOS ÀS HABILIDADES', y, margin, maxW)
  y = addParagraph(
    doc,
    p.habilidades?.length
      ? p.habilidades.map((h) => `• ${h.descricao || h.resumo || h.id}`).join('\n')
      : 'Nenhuma habilidade vinculada.',
    y,
    margin,
    maxW
  )

  y = addSection(doc, '4. ESTRATÉGIAS A SEREM UTILIZADAS', y, margin, maxW)
  y = addParagraph(
    doc,
    p.estrategias?.length
      ? p.estrategias.map((e) => `• ${e.descricao}`).join('\n')
      : 'Nenhuma estratégia vinculada.',
    y,
    margin,
    maxW
  )

  y = addSection(doc, '5. CRITÉRIOS AVALIATIVOS', y, margin, maxW)
  y = addParagraph(
    doc,
    p.avaliacao?.length
      ? p.avaliacao.map((a) => `• ${a.descricao}`).join('\n')
      : 'Nenhum critério vinculado.',
    y,
    margin,
    maxW
  )

  y = addSection(doc, '6. ENCONTROS', y, margin, maxW)
  const encontros = [...(p.encontros ?? [])].sort((a, b) => String(a.dataEnc).localeCompare(String(b.dataEnc)))
  if (encontros.length === 0) {
    y = addParagraph(doc, 'Nenhum encontro registrado.', y, margin, maxW)
  } else {
    for (const enc of encontros) {
      const dataFmt = new Date(`${enc.dataEnc}T12:00:00`).toLocaleDateString('pt-BR')
      const bloco = [
        `Data: ${dataFmt}`,
        `Planejado: ${(enc.textoPlanejado ?? '').trim() || '—'}`,
        `Habilidade: ${labelHabilidade(p, enc.habilidadeId)}`,
        `Estratégia: ${labelEstrategia(p, enc.estrategiaId)}`,
      ].join('\n')
      y = addParagraph(doc, bloco, y, margin, maxW)
      y += 2
    }
  }

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
