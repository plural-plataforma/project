import { downloadEstudoCasoDocx } from '@/lib/exportEstudoCasoDocx'
import { downloadEstudoCasoPdf } from '@/lib/exportEstudoCasoPdf'
import { sanitizarTextoEstudoCaso } from '@/lib/sanitizarTextoEstudoCaso'
import { buscarEstudoCasoPorId, gerarTextoIAEstudoCaso } from '@/services/estudoCasoService'
import type { EstudoCasoDetalhe } from '@/types/estudoCaso'

async function obterDetalheParaExport(estudoId: number): Promise<{ detalhe: EstudoCasoDetalhe; texto: string }> {
  let detalhe = await buscarEstudoCasoPorId(estudoId)
  if (!detalhe.textoSimulado?.trim()) {
    detalhe = await gerarTextoIAEstudoCaso(estudoId)
  }
  const texto = sanitizarTextoEstudoCaso(detalhe.textoSimulado?.trim() ?? '')
  if (!texto) throw new Error('Não há texto disponível para download.')
  return { detalhe, texto }
}

export async function baixarEstudoCasoWord(estudoId: number): Promise<void> {
  const { detalhe, texto } = await obterDetalheParaExport(estudoId)
  await downloadEstudoCasoDocx({
    ...detalhe,
    tituloEstudo: detalhe.titulo.trim() || 'Estudo de caso',
    alunoNome: detalhe.alunoNomeCompleto?.trim() || 'Aluno(a)',
    textoCompleto: texto,
  })
}

export async function baixarEstudoCasoPdf(estudoId: number): Promise<void> {
  const { detalhe, texto } = await obterDetalheParaExport(estudoId)
  downloadEstudoCasoPdf({
    ...detalhe,
    tituloEstudo: detalhe.titulo.trim() || 'Estudo de caso',
    alunoNome: detalhe.alunoNomeCompleto?.trim() || 'Aluno(a)',
    textoCompleto: texto,
  })
}
