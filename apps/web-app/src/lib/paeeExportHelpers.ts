import type { Aluno } from '@/types/aluno'
import { labelTipoAtendimentoAee } from '@/types/aluno'

/** Texto do bloco "Período e organização" quando há um aluno vinculado. */
export function formatOrganizacaoAtendimentoAluno(aluno: Aluno): string {
  const partes: string[] = []
  if (aluno.frequenciaSemanalAtendimento != null) {
    partes.push(`Frequência semanal: ${aluno.frequenciaSemanalAtendimento}x`)
  }
  if (aluno.diasSemanaAtendimento?.length) {
    partes.push(`Dias: ${aluno.diasSemanaAtendimento.join(', ')}`)
  }
  if (aluno.duracaoAtendimentoMinutos != null) {
    partes.push(`Duração por sessão: ${aluno.duracaoAtendimentoMinutos} minutos`)
  }
  const tipo = labelTipoAtendimentoAee(aluno.tipoAtendimentoAee)
  if (tipo) partes.push(`Tipo de atendimento AEE: ${tipo}`)
  return partes.length > 0
    ? partes.join('. ') + '.'
    : 'Frequência e dias na rotina escolar: conferir cadastro do aluno.'
}
