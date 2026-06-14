import { describe, expect, it } from 'vitest'
import { avaliarCompletudePaee } from './paeeCompletude'
import type { Planejamento } from '@/types/planejamento'

const base: Planejamento = {
  id: 1,
  apelido: 'Teste',
  dataInicio: '2026-01-01',
  dataFim: '2026-12-31',
  descicaoPlanejamento: '',
  alunos: [{ id: 1, nomeCompleto: 'Aluno' }],
  habilidades: [{ id: 1, descricao: 'H1', resumo: 'H1', idNivelEnsino: 1, tipo: 'x' }],
  estrategias: [{ id: 1, descricao: 'E1' }],
  avaliacao: [{ id: 1, descricao: 'C1' }],
  objetivoCurtoPrazo: 'Curto',
  objetivoMedioPrazo: 'Medio',
  objetivoLongoPrazo: 'Longo',
  encontros: [{ id: 1, dataEnc: '2026-02-01', textoPlanejado: 'P' }],
}

describe('avaliarCompletudePaee', () => {
  it('marca completo quando obrigatórios preenchidos', () => {
    const r = avaliarCompletudePaee(base)
    expect(r.completo).toBe(true)
    expect(r.percentual).toBe(100)
  })

  it('marca incompleto sem encontros', () => {
    const r = avaliarCompletudePaee({ ...base, encontros: [] })
    expect(r.completo).toBe(false)
    expect(r.itens.find((i) => i.id === 'encontros')?.ok).toBe(false)
  })
})

describe('formatOrganizacaoAtendimentoAluno', () => {
  it('monta texto com frequência e dias', async () => {
    const { formatOrganizacaoAtendimentoAluno } = await import('./paeeExportHelpers')
    const txt = formatOrganizacaoAtendimentoAluno({
      nomeCompleto: 'A',
      estado: 'SP',
      responsavel: { nomeCompleto: 'R', telefone: '1' },
      frequenciaSemanalAtendimento: 2,
      diasSemanaAtendimento: ['Segunda', 'Quarta'],
      duracaoAtendimentoMinutos: 50,
      tipoAtendimentoAee: 0,
    })
    expect(txt).toContain('Frequência semanal: 2x')
    expect(txt).toContain('Segunda')
  })
})
