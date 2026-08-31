import { labelTipoAtendimentoAee } from '@/types/aluno'

/**
 * Seção "1. Identificação do estudante" do Relatório Pedagógico — vem direto do cadastro
 * do aluno, nunca passa por IA (fica fora das 14 chaves de `RelatorioSecaoChave`). Fonte
 * única de conteúdo pros exportadores docx e pdf, cada um só aplicando sua própria
 * estilização — mesmo padrão de `estudoCasoMetadados.ts`. Campos seguem exatamente o
 * template "RELATÓRIO PEDAGÓGICO DO ATENDIMENTO EDUCACIONAL ESPECIALIZADO" da cliente.
 */

export interface RelatorioMetadadosCampo {
  label: string
  valor: string
}

export interface RelatorioMetadadosInput {
  escolaNomeInstituicao?: string | null
  professorNomeCompleto?: string | null
  alunoDataNascimento?: string | null // "yyyy-MM-dd"
  alunoAno?: string | null
  alunoFrequenciaSemanalAtendimento?: number | null
  alunoDuracaoAtendimentoMinutos?: number | null
  alunoTipoAtendimentoAee?: number | null
  dataInicio: string // "yyyy-MM-dd"
  dataFim: string // "yyyy-MM-dd"
  tipoPeriodoLabel: string
}

function calcularIdadeNaData(dataNascimentoIso: string, dataReferenciaIso: string): number | null {
  const nascimento = new Date(`${dataNascimentoIso}T12:00:00`)
  const referencia = new Date(`${dataReferenciaIso}T12:00:00`)
  if (Number.isNaN(nascimento.getTime()) || Number.isNaN(referencia.getTime())) return null
  let idade = referencia.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversario =
    referencia.getMonth() < nascimento.getMonth() ||
    (referencia.getMonth() === nascimento.getMonth() && referencia.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversario) idade -= 1
  return idade >= 0 ? idade : null
}

/** Campos da seção 1 (Identificação do estudante), na ordem exata do template da cliente. */
export function montarCamposIdentificacaoRelatorio(
  input: RelatorioMetadadosInput,
  alunoNome: string
): RelatorioMetadadosCampo[] {
  const dataNascimentoFormatada = input.alunoDataNascimento
    ? new Date(`${input.alunoDataNascimento}T12:00:00`).toLocaleDateString('pt-BR')
    : null
  const idade = input.alunoDataNascimento
    ? calcularIdadeNaData(input.alunoDataNascimento, input.dataFim)
    : null
  const inicioFormatado = new Date(`${input.dataInicio}T12:00:00`).toLocaleDateString('pt-BR')
  const fimFormatado = new Date(`${input.dataFim}T12:00:00`).toLocaleDateString('pt-BR')
  const tipoAtendimento = labelTipoAtendimentoAee(input.alunoTipoAtendimentoAee)

  return [
    { label: 'Nome do estudante', valor: alunoNome || 'não informado' },
    { label: 'Data de nascimento', valor: dataNascimentoFormatada || 'não informada no cadastro' },
    { label: 'Idade', valor: idade != null ? `${idade} anos (ao final do período)` : 'não calculada — sem data de nascimento no cadastro' },
    { label: 'Ano/Turma', valor: input.alunoAno?.trim() || 'não informado' },
    { label: 'Escola', valor: input.escolaNomeInstituicao?.trim() || 'não informada' },
    { label: 'Professor(a) do AEE', valor: input.professorNomeCompleto?.trim() || 'não informado' },
    { label: 'Período avaliado', valor: `${input.tipoPeriodoLabel} — ${inicioFormatado} a ${fimFormatado}` },
    { label: 'Organização do atendimento', valor: tipoAtendimento || 'não informada no cadastro' },
    {
      label: 'Frequência dos atendimentos',
      valor:
        input.alunoFrequenciaSemanalAtendimento != null
          ? `${input.alunoFrequenciaSemanalAtendimento}x por semana`
          : 'não informada no cadastro',
    },
    {
      label: 'Carga horária',
      valor:
        input.alunoDuracaoAtendimentoMinutos != null
          ? `${input.alunoDuracaoAtendimentoMinutos} minutos por sessão`
          : 'não informada no cadastro',
    },
  ]
}
