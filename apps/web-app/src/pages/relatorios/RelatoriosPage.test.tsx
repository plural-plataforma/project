import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import RelatoriosPage, { classifyPdi, computePercentual } from './RelatoriosPage'
import type { Planejamento } from '@/types/planejamento'

/**
 * Testes da RelatoriosPage.
 * Nota: Renderização não é testada devido a múltiplas instâncias de React no monorepo.
 */
describe('RelatoriosPage', () => {
  describe('computePercentual', () => {
    it('retorna 0 quando não há registros do aluno', () => {
      expect(computePercentual([], 1)).toBe(0)
      expect(computePercentual([{ alunoId: 2, nivelRealizacao: 'Autonomia' }], 1)).toBe(0)
    })

    it('retorna 100 quando todos são Autonomia', () => {
      const registros = [
        { alunoId: 1, nivelRealizacao: 'Autonomia' },
        { alunoId: 1, nivelRealizacao: 'Autonomia' },
      ]
      expect(computePercentual(registros, 1)).toBe(100)
    })

    it('calcula média com ComAjuda (50% cada)', () => {
      const registros = [
        { alunoId: 1, nivelRealizacao: 'Autonomia' },
        { alunoId: 1, nivelRealizacao: 'ComAjuda' },
      ]
      expect(computePercentual(registros, 1)).toBe(75) // (1 + 0.5) / 2 * 100
    })
  })

  describe('classifyPdi', () => {
    const basePdi: Planejamento = {
      id: 1,
      apelido: 'PDI Teste',
      dataInicio: '',
      dataFim: '',
      descicaoPlanejamento: '',
    }

    it('classifica como em_andamento quando período inclui hoje', () => {
      const hoje = dayjs()
      const pdi: Planejamento = {
        ...basePdi,
        dataInicio: hoje.subtract(1, 'day').format('YYYY-MM-DD'),
        dataFim: hoje.add(1, 'day').format('YYYY-MM-DD'),
      }
      expect(classifyPdi(pdi)).toBe('em_andamento')
    })

    it('classifica como encerrado quando dataFim é anterior a hoje', () => {
      const hoje = dayjs()
      const pdi: Planejamento = {
        ...basePdi,
        dataInicio: hoje.subtract(10, 'day').format('YYYY-MM-DD'),
        dataFim: hoje.subtract(1, 'day').format('YYYY-MM-DD'),
      }
      expect(classifyPdi(pdi)).toBe('encerrado')
    })

    it('classifica como futuro quando dataInicio é posterior a hoje', () => {
      const hoje = dayjs()
      const pdi: Planejamento = {
        ...basePdi,
        dataInicio: hoje.add(5, 'day').format('YYYY-MM-DD'),
        dataFim: hoje.add(10, 'day').format('YYYY-MM-DD'),
      }
      expect(classifyPdi(pdi)).toBe('futuro')
    })
  })

  describe('módulo', () => {
    it('exporta componente como default', () => {
      expect(typeof RelatoriosPage).toBe('function')
    })
  })
})
