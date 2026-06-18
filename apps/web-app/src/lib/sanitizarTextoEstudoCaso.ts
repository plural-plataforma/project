const AVISO_CABECALHO = /^\*\*\* RASCUNHO AUTOMÁTICO/i
const AVISO_RODAPE = /^Rascunho gerado automaticamente pela plataforma Plural\./i

/** Remove avisos legados de rascunho (textos já salvos antes da remoção no backend). */
export function sanitizarTextoEstudoCaso(texto: string): string {
  const linhas = texto.split(/\r?\n/).filter((linha) => {
    const t = linha.trim()
    if (AVISO_CABECALHO.test(t)) return false
    if (AVISO_RODAPE.test(t)) return false
    return true
  })

  while (linhas.length > 0) {
    const t = linhas[linhas.length - 1]?.trim()
    if (t === '' || t === '---') {
      linhas.pop()
      continue
    }
    break
  }

  while (linhas.length > 0 && linhas[0]?.trim() === '') {
    linhas.shift()
  }

  return linhas.join('\n')
}
