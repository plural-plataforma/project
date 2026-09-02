import { downloadPaeePlanejamentoDocx } from '@/lib/exportPaeePlanejamentoDocx'
import { downloadPaeePlanejamentoPdf } from '@/lib/exportPaeePlanejamentoPdf'
import { buscarPlanejamentoPorId } from '@/services/planejamentoService'
import { buscarAlunoPorId } from '@/services/alunoService'
import { buscarEscolaPorId } from '@/services/escolasService'
import { buscarProfessor } from '@/services/professorService'

async function alunoUnicoParaExport(plan: Awaited<ReturnType<typeof buscarPlanejamentoPorId>>) {
  const alunos = plan.alunos ?? []
  if (alunos.length !== 1 || alunos[0].id == null) return null
  try {
    return await buscarAlunoPorId(alunos[0].id)
  } catch {
    return null
  }
}

async function nomeEscolaParaExport(idEscola?: number): Promise<string | undefined> {
  if (idEscola == null) return undefined
  try {
    return (await buscarEscolaPorId(idEscola)).nomeInstituicao
  } catch {
    return undefined
  }
}

async function nomeProfessorParaExport(): Promise<string | undefined> {
  try {
    return (await buscarProfessor()).objeto.nomeCompleto
  } catch {
    return undefined
  }
}

export async function baixarPlanejamentoWord(planejamentoId: number): Promise<void> {
  const plan = await buscarPlanejamentoPorId(planejamentoId)
  const alunoAtendimento = await alunoUnicoParaExport(plan)
  const [nomeEscola, nomeProfessorAee] = await Promise.all([
    nomeEscolaParaExport(alunoAtendimento?.idEscola),
    nomeProfessorParaExport(),
  ])
  await downloadPaeePlanejamentoDocx({ planejamento: plan, alunoAtendimento, nomeEscola, nomeProfessorAee })
}

export async function baixarPlanejamentoPdf(planejamentoId: number): Promise<void> {
  const plan = await buscarPlanejamentoPorId(planejamentoId)
  const alunoAtendimento = await alunoUnicoParaExport(plan)
  const [nomeEscola, nomeProfessorAee] = await Promise.all([
    nomeEscolaParaExport(alunoAtendimento?.idEscola),
    nomeProfessorParaExport(),
  ])
  downloadPaeePlanejamentoPdf({ planejamento: plan, alunoAtendimento, nomeEscola, nomeProfessorAee })
}
