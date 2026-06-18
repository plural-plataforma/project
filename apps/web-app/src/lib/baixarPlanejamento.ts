import { downloadPaeePlanejamentoDocx } from '@/lib/exportPaeePlanejamentoDocx'
import { downloadPaeePlanejamentoPdf } from '@/lib/exportPaeePlanejamentoPdf'
import { buscarPlanejamentoPorId } from '@/services/planejamentoService'
import { buscarAlunoPorId } from '@/services/alunoService'

async function alunoUnicoParaExport(plan: Awaited<ReturnType<typeof buscarPlanejamentoPorId>>) {
  const alunos = plan.alunos ?? []
  if (alunos.length !== 1 || alunos[0].id == null) return null
  try {
    return await buscarAlunoPorId(alunos[0].id)
  } catch {
    return null
  }
}

export async function baixarPlanejamentoWord(planejamentoId: number): Promise<void> {
  const plan = await buscarPlanejamentoPorId(planejamentoId)
  const alunoAtendimento = await alunoUnicoParaExport(plan)
  await downloadPaeePlanejamentoDocx({ planejamento: plan, alunoAtendimento })
}

export async function baixarPlanejamentoPdf(planejamentoId: number): Promise<void> {
  const plan = await buscarPlanejamentoPorId(planejamentoId)
  const alunoAtendimento = await alunoUnicoParaExport(plan)
  downloadPaeePlanejamentoPdf({ planejamento: plan, alunoAtendimento })
}
