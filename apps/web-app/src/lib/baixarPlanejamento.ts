import { downloadPaeePlanejamentoDocx } from '@/lib/exportPaeePlanejamentoDocx'
import { downloadPaeePlanejamentoPdf } from '@/lib/exportPaeePlanejamentoPdf'
import { buscarPlanejamentoPorId } from '@/services/planejamentoService'

export async function baixarPlanejamentoWord(planejamentoId: number): Promise<void> {
  const plan = await buscarPlanejamentoPorId(planejamentoId)
  await downloadPaeePlanejamentoDocx({ planejamento: plan })
}

export async function baixarPlanejamentoPdf(planejamentoId: number): Promise<void> {
  const plan = await buscarPlanejamentoPorId(planejamentoId)
  downloadPaeePlanejamentoPdf({ planejamento: plan })
}
