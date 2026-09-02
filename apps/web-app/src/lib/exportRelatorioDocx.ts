import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx'
import { montarCamposIdentificacaoRelatorio, type RelatorioMetadadosInput } from '@/lib/relatorioMetadados'
import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_NUMERO,
  RELATORIO_SECAO_ORDEM,
  type Relatorio,
} from '@/types/relatorio'

const COR_AZUL = '1D3557'
const COR_CINZA = '666666'
const FONTE_PADRAO = 'Calibri'

function slugArquivoPart(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'relatorio'
}

function paragrafoTituloSecao(titulo: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: titulo, bold: true, size: 24, color: COR_AZUL, font: FONTE_PADRAO })],
    spacing: { before: 320, after: 120 },
  })
}

function paragrafoCampo(label: string, valor: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 18, font: FONTE_PADRAO }),
      new TextRun({ text: valor, size: 18, font: FONTE_PADRAO }),
    ],
    spacing: { after: 40 },
  })
}

function paragrafoCorpo(texto: string, opts?: { italico?: boolean; tamanho?: number }): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: texto, size: opts?.tamanho ?? 22, italics: opts?.italico, font: FONTE_PADRAO }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: convertInchesToTwip(0.15) },
    spacing: { after: 200 },
  })
}

/** Gera o .docx do Relatório Pedagógico finalizado, seguindo o layout do template de 15 seções da cliente. */
export async function downloadRelatorioDocx(relatorio: Relatorio): Promise<void> {
  const identificacaoInput: RelatorioMetadadosInput = {
    escolaNomeInstituicao: relatorio.escolaNomeInstituicao,
    professorNomeCompleto: relatorio.professorNomeCompleto,
    alunoDataNascimento: relatorio.alunoDataNascimento,
    alunoAno: relatorio.alunoAno,
    alunoFrequenciaSemanalAtendimento: relatorio.alunoFrequenciaSemanalAtendimento,
    alunoDuracaoAtendimentoMinutos: relatorio.alunoDuracaoAtendimentoMinutos,
    alunoTipoAtendimentoAee: relatorio.alunoTipoAtendimentoAee,
    dataInicio: relatorio.dataInicio,
    dataFim: relatorio.dataFim,
    tipoPeriodoLabel: relatorio.tipoPeriodo === 1 ? 'Semestral' : 'Trimestral',
  }

  const secoesPorChave = new Map(relatorio.secoes.map((s) => [s.secaoChave, s]))

  const children: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: 'RELATÓRIO PEDAGÓGICO DO AEE', bold: true, size: 28, color: COR_AZUL, font: FONTE_PADRAO }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Estudante: ${relatorio.alunoNome}`,
          italics: true,
          size: 18,
          color: COR_CINZA,
          font: FONTE_PADRAO,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    paragrafoTituloSecao('1. Identificação do estudante'),
    ...montarCamposIdentificacaoRelatorio(identificacaoInput, relatorio.alunoNome).map((campo) =>
      paragrafoCampo(campo.label, campo.valor)
    ),
  ]

  RELATORIO_SECAO_ORDEM.forEach((chave) => {
    const secao = secoesPorChave.get(chave)
    const texto = (secao?.textoEditado ?? secao?.textoGerado ?? '').trim()

    children.push(paragrafoTituloSecao(`${RELATORIO_SECAO_NUMERO[chave]}. ${RELATORIO_SECAO_LABELS[chave]}`))
    children.push(paragrafoCorpo(texto || 'Informação insuficiente — não preenchida.'))
    if (secao?.notasManuais?.trim()) {
      children.push(paragrafoCorpo(`Notas manuais: ${secao.notasManuais.trim()}`, { italico: true, tamanho: 18 }))
    }
  })

  children.push(
    paragrafoTituloSecao('Local e data, assinatura'),
    paragrafoCampo('Local e data', '_______________________________________________'),
    paragrafoCampo('Professor(a) do AEE', relatorio.professorNomeCompleto?.trim() || 'não informado'),
    paragrafoCampo('Assinatura', '_______________________________________________')
  )

  const doc = new Document({
    creator: 'Plural Plataforma',
    title: `Relatório Pedagógico — ${relatorio.alunoNome}`,
    description: `Relatório Pedagógico do AEE — ${relatorio.alunoNome}`,
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
  const nomeBase = slugArquivoPart(relatorio.alunoNome)
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `RelatorioPedagogico_${nomeBase}.docx`
  link.click()
  window.URL.revokeObjectURL(url)
}
