import { describe, expect, it } from 'vitest'
import { parseEstudoCasoDocumento } from './parseEstudoCasoDocumento'

describe('parseEstudoCasoDocumento', () => {
  it('extrai cabeçalho, metadados e seções numeradas', () => {
    const texto = [
      'ESTUDO DE CASO — AEE',
      'Teste',
      '',
      'Estudante: Leo   |   Ano/Série: 3º   |   Data: 14/06/2026',
      'Escola: Luiza Maria   |   Professor(a) AEE: Sabrina',
      '',
      '1. Identificação do(a) estudante',
      '',
      'Leo, 10 anos de idade.',
      '',
      '2. Levantamento das barreiras e potencialidades',
      '',
      'Barreiras observadas:',
      '• Comunicação: observação registrada.',
    ].join('\n')

    const doc = parseEstudoCasoDocumento(texto)

    expect(doc.subtitulo).toBe('Teste')
    expect(doc.metadados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ chave: 'Estudante', valor: 'Leo' }),
        expect.objectContaining({ chave: 'Escola', valor: 'Luiza Maria' }),
      ])
    )
    expect(doc.secoes).toHaveLength(2)
    expect(doc.secoes[0]).toMatchObject({ numero: '1', titulo: 'Identificação do(a) estudante' })
    expect(doc.secoes[1].linhas.some((l) => l.tipo === 'bullet')).toBe(true)
  })
})
