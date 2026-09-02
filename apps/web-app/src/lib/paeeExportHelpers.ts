import type { Aluno } from '@/types/aluno'

const FALLBACK_NAO_INFORMADO = 'não informado'

/** Idade em anos completos na data atual, a partir da data de nascimento (yyyy-mm-dd). */
export function calcularIdade(dataNascimento?: string | null): string {
  if (!dataNascimento) return FALLBACK_NAO_INFORMADO
  const nascimento = new Date(`${dataNascimento}T12:00:00`)
  if (Number.isNaN(nascimento.getTime())) return FALLBACK_NAO_INFORMADO
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversario) idade -= 1
  return `${idade} anos`
}

/** Texto de "Frequência dos atendimentos" a partir do cadastro do aluno. */
export function formatFrequenciaAtendimentos(aluno: Aluno): string {
  if (aluno.frequenciaSemanalAtendimento == null) return 'conferir cadastro do aluno'
  const dias = aluno.diasSemanaAtendimento?.length ? ` (${aluno.diasSemanaAtendimento.join(', ')})` : ''
  return `${aluno.frequenciaSemanalAtendimento}x por semana${dias}`
}

/** Carga horária semanal total = frequência semanal × duração por sessão. */
export function formatCargaHorariaSemanal(aluno: Aluno): string {
  if (aluno.frequenciaSemanalAtendimento == null || aluno.duracaoAtendimentoMinutos == null) {
    return 'conferir cadastro do aluno'
  }
  const totalMinutos = aluno.frequenciaSemanalAtendimento * aluno.duracaoAtendimentoMinutos
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60
  if (horas === 0) return `${minutos}min semanais`
  if (minutos === 0) return `${horas}h semanais`
  return `${horas}h${minutos}min semanais`
}

/** Checkbox textual "( ) Individual ( ) Grupo" marcado conforme tipoAtendimentoAee (Colaborativo conta como Grupo). */
export function formatOrganizacaoCheckbox(aluno: Aluno): string {
  const individual = aluno.tipoAtendimentoAee === 0
  const grupo = aluno.tipoAtendimentoAee === 1 || aluno.tipoAtendimentoAee === 2
  return `(${individual ? 'X' : ' '}) Individual (${grupo ? 'X' : ' '}) Grupo`
}

/** Texto do "Diagnóstico médico (resumo)" a partir do laudo cadastrado do aluno. */
export function formatDiagnosticoMedicoAluno(aluno: Aluno): string {
  const laudo = aluno.laudos?.[0]
  if (!laudo) return ''
  const partes: string[] = []
  if (laudo.codigoCid?.trim()) partes.push(`CID: ${laudo.codigoCid.trim()}`)
  if (laudo.descricao?.trim()) partes.push(laudo.descricao.trim())
  if (laudo.nomeMedico?.trim()) partes.push(`Médico: ${laudo.nomeMedico.trim()}`)
  return partes.join(' — ')
}
