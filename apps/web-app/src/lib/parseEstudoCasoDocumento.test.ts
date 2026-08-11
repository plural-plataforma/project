import { describe, expect, it } from 'vitest'
import { converterSecaoParaTextoCorrido, parseEstudoCasoDocumento } from './parseEstudoCasoDocumento'

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

describe('converterSecaoParaTextoCorrido', () => {
  it('agrupa bullets consecutivos sob cada subseção em um parágrafo único, sem bullet', () => {
    const secao = {
      numero: '2',
      titulo: 'Levantamento das barreiras e potencialidades',
      linhas: [
        { tipo: 'subsecao' as const, texto: 'Barreiras observadas:' },
        { tipo: 'bullet' as const, texto: '• Comunicação: dificuldade de dicção.' },
        { tipo: 'bullet' as const, texto: '• Cognição: raciocínio lento.' },
        { tipo: 'subsecao' as const, texto: 'Potencialidades identificadas:' },
        { tipo: 'bullet' as const, texto: '• Boa comunicação oral.' },
      ],
    }

    const convertida = converterSecaoParaTextoCorrido(secao)

    expect(convertida.linhas).toEqual([
      { tipo: 'subsecao', texto: 'Barreiras observadas:' },
      { tipo: 'corpo', texto: 'Comunicação: dificuldade de dicção. Cognição: raciocínio lento.' },
      { tipo: 'subsecao', texto: 'Potencialidades identificadas:' },
      { tipo: 'corpo', texto: 'Boa comunicação oral.' },
    ])
  })

  it('agrupa linhas corpo consecutivas (sem subseção) em um parágrafo único', () => {
    const secao = {
      numero: '3',
      titulo: 'Avaliação pedagógica e funcional',
      linhas: [
        { tipo: 'corpo' as const, texto: 'Em relação a comunicação e linguagem: dificuldade de dicção.' },
        { tipo: 'corpo' as const, texto: 'Em relação a cognição e aprendizagem: raciocínio lento.' },
      ],
    }

    const convertida = converterSecaoParaTextoCorrido(secao)

    expect(convertida.linhas).toEqual([
      {
        tipo: 'corpo',
        texto:
          'Em relação a comunicação e linguagem: dificuldade de dicção. Em relação a cognição e aprendizagem: raciocínio lento.',
      },
    ])
  })

  it('não muta a seção original', () => {
    const secao = {
      numero: '3',
      titulo: 'Avaliação pedagógica e funcional',
      linhas: [{ tipo: 'corpo' as const, texto: 'Em relação a X: Y.' }],
    }

    converterSecaoParaTextoCorrido(secao)

    expect(secao.linhas).toHaveLength(1)
  })
})
