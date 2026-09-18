import { describe, expect, it } from 'vitest'
import { montarParagrafosTextoFinal, montarSecoesRelatorioParaExport } from './relatorioSecoesExport'
import type { RelatorioSecao, RelatorioSecaoChaveCodigo } from '@/types/relatorio'

function secao(
  secaoChave: RelatorioSecaoChaveCodigo,
  campos: Partial<RelatorioSecao> = {}
): RelatorioSecao {
  return {
    secaoChave,
    textoGerado: null,
    textoEditado: null,
    textoRevisado: null,
    geradoEm: null,
    editadoEm: null,
    informacaoInsuficiente: false,
    ...campos,
  }
}

describe('montarSecoesRelatorioParaExport', () => {
  it('omite seção sem texto', () => {
    const resultado = montarSecoesRelatorioParaExport([
      secao(0, { textoGerado: 'Contextualização.' }),
      secao(2),
      secao(3, { textoGerado: 'Cognição.' }),
    ])

    expect(resultado.map((s) => s.titulo)).toEqual([
      '2. Contextualização do atendimento',
      '3. Aspectos cognitivos e funções executivas',
    ])
  })

  it('usa o texto editado quando existe, ignorando o gerado', () => {
    const resultado = montarSecoesRelatorioParaExport([
      secao(1, { textoGerado: 'Texto da IA.', textoEditado: 'Texto da professora.' }),
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0].corpo).toBe('Texto da professora.')
  })

  it('cai no texto gerado quando a professora não editou', () => {
    const resultado = montarSecoesRelatorioParaExport([secao(1, { textoGerado: 'Texto da IA.' })])

    expect(resultado[0].corpo).toBe('Texto da IA.')
  })

  it('omite seção sem nenhum texto', () => {
    const resultado = montarSecoesRelatorioParaExport([secao(1, {}), secao(2, { textoGerado: 'Tem texto.' })])

    expect(resultado).toHaveLength(1)
    expect(resultado[0].titulo).toBe('2. Comunicação e linguagem')
  })

  it('prioriza o texto revisado pela IA', () => {
    const resultado = montarSecoesRelatorioParaExport([
      secao(1, { textoGerado: 'IA.', textoEditado: 'Professora.', textoRevisado: 'Revisado.' }),
    ])

    expect(resultado[0].corpo).toBe('Revisado.')
  })

  it('mantém relatórios antigos, sem revisão, funcionando', () => {
    const resultado = montarSecoesRelatorioParaExport([
      secao(1, { textoGerado: 'IA.', textoEditado: 'Professora.' }),
    ])

    expect(resultado[0].corpo).toBe('Professora.')
  })
})

describe('montarParagrafosTextoFinal', () => {
  it('quebra o texto final em parágrafos por linha em branco', () => {
    const resultado = montarParagrafosTextoFinal('Primeiro parágrafo.\n\nSegundo parágrafo.')

    expect(resultado).toEqual(['Primeiro parágrafo.', 'Segundo parágrafo.'])
  })

  it('descarta parágrafos vazios vindos de quebras extras', () => {
    const resultado = montarParagrafosTextoFinal('\n\nPrimeiro.\n\n\n\nSegundo.\n\n')

    expect(resultado).toEqual(['Primeiro.', 'Segundo.'])
  })
})
