import { describe, expect, it } from 'vitest'
import { montarSecoesRelatorioParaExport } from './relatorioSecoesExport'
import type { RelatorioSecao, RelatorioSecaoChaveCodigo } from '@/types/relatorio'

function secao(
  secaoChave: RelatorioSecaoChaveCodigo,
  campos: Partial<RelatorioSecao> = {}
): RelatorioSecao {
  return {
    secaoChave,
    textoGerado: null,
    textoEditado: null,
    notasManuais: null,
    geradoEm: null,
    editadoEm: null,
    informacaoInsuficiente: false,
    ...campos,
  }
}

describe('montarSecoesRelatorioParaExport', () => {
  it('omite seção sem texto e sem notas manuais', () => {
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

  it('incorpora notas manuais ao texto da seção', () => {
    const resultado = montarSecoesRelatorioParaExport([
      secao(1, { textoGerado: 'Leo demonstra bom aproveitamento.', notasManuais: 'Gosta muito de quadrinhos.' }),
    ])

    expect(resultado[0].corpo).toBe('Leo demonstra bom aproveitamento. Gosta muito de quadrinhos.')
  })

  it('fecha o texto com ponto antes de emendar a nota manual', () => {
    const resultado = montarSecoesRelatorioParaExport([
      secao(1, { textoGerado: 'Leo demonstra bom aproveitamento', notasManuais: 'Gosta de quadrinhos.' }),
    ])

    expect(resultado[0].corpo).toBe('Leo demonstra bom aproveitamento. Gosta de quadrinhos.')
  })

  it('mantém seção que só tem notas manuais', () => {
    const resultado = montarSecoesRelatorioParaExport([secao(2, { notasManuais: 'Faltou algumas vezes.' })])

    expect(resultado).toEqual([{ titulo: '2. Comunicação e linguagem', corpo: 'Faltou algumas vezes.' }])
  })

  it('prioriza o texto editado sobre o gerado', () => {
    const resultado = montarSecoesRelatorioParaExport([
      secao(0, { textoGerado: 'Gerado.', textoEditado: 'Editado pela professora.' }),
    ])

    expect(resultado[0].corpo).toBe('Editado pela professora.')
  })
})
