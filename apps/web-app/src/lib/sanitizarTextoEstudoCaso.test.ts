import { describe, expect, it } from 'vitest'
import { sanitizarTextoEstudoCaso } from './sanitizarTextoEstudoCaso'

describe('sanitizarTextoEstudoCaso', () => {
  it('remove cabeçalho e rodapé legados de rascunho', () => {
    const bruto = [
      '*** RASCUNHO AUTOMÁTICO — REVISÃO PEDAGÓGICA OBRIGATÓRIA ***',
      '',
      'ESTUDO DE CASO — AEE',
      'Teste',
      '---',
      'Rascunho gerado automaticamente pela plataforma Plural. Revisão e complementação pedagógica são obrigatórias antes de qualquer uso oficial.',
    ].join('\n')

    expect(sanitizarTextoEstudoCaso(bruto)).toBe(['ESTUDO DE CASO — AEE', 'Teste'].join('\n'))
  })
})
