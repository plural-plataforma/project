import { downloadEstudoCasoDocx } from '@/lib/exportEstudoCasoDocx'
import { downloadEstudoCasoPdf } from '@/lib/exportEstudoCasoPdf'
import { sanitizarTextoEstudoCaso } from '@/lib/sanitizarTextoEstudoCaso'
import { buscarEstudoCasoPorId, gerarTextoIAEstudoCaso } from '@/services/estudoCasoService'

async function obterTextoEstudo(estudoId: number): Promise<{
  titulo: string
  alunoNome: string
  texto: string
}> {
  let detalhe = await buscarEstudoCasoPorId(estudoId)
  if (!detalhe.textoSimulado?.trim()) {
    detalhe = await gerarTextoIAEstudoCaso(estudoId)
  }
  const texto = sanitizarTextoEstudoCaso(detalhe.textoSimulado?.trim() ?? '')
  if (!texto) throw new Error('Não há texto disponível para download.')
  return {
    titulo: detalhe.titulo.trim() || 'Estudo de caso',
    alunoNome: detalhe.alunoNomeCompleto?.trim() || 'Aluno(a)',
    texto,
  }
}

export async function baixarEstudoCasoWord(estudoId: number): Promise<void> {
  const { titulo, alunoNome, texto } = await obterTextoEstudo(estudoId)
  await downloadEstudoCasoDocx({
    tituloEstudo: titulo,
    alunoNome,
    textoCompleto: texto,
  })
}

export async function baixarEstudoCasoPdf(estudoId: number): Promise<void> {
  const { titulo, alunoNome, texto } = await obterTextoEstudo(estudoId)
  downloadEstudoCasoPdf({
    tituloEstudo: titulo,
    alunoNome,
    textoCompleto: texto,
  })
}
