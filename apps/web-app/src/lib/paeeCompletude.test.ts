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

describe('paeeExportHelpers', () => {
  const alunoBase = {
    nomeCompleto: 'A',
    estado: 'SP',
    responsavel: { nomeCompleto: 'R', telefone: '1' },
    frequenciaSemanalAtendimento: 2,
    diasSemanaAtendimento: ['Segunda', 'Quarta'],
    duracaoAtendimentoMinutos: 50,
    tipoAtendimentoAee: 0,
  }

  it('formatFrequenciaAtendimentos monta texto com frequência e dias', async () => {
    const { formatFrequenciaAtendimentos } = await import('./paeeExportHelpers')
    const txt = formatFrequenciaAtendimentos(alunoBase)
    expect(txt).toContain('2x por semana')
    expect(txt).toContain('Segunda')
  })

  it('formatCargaHorariaSemanal calcula total semanal', async () => {
    const { formatCargaHorariaSemanal } = await import('./paeeExportHelpers')
    expect(formatCargaHorariaSemanal(alunoBase)).toBe('1h40min semanais')
  })

  it('formatOrganizacaoCheckbox marca Individual quando tipoAtendimentoAee é 0', async () => {
    const { formatOrganizacaoCheckbox } = await import('./paeeExportHelpers')
    expect(formatOrganizacaoCheckbox(alunoBase)).toBe('(X) Individual ( ) Grupo')
    expect(formatOrganizacaoCheckbox({ ...alunoBase, tipoAtendimentoAee: 1 })).toBe('( ) Individual (X) Grupo')
  })

  it('calcularIdade retorna anos completos a partir da data de nascimento', async () => {
    const { calcularIdade } = await import('./paeeExportHelpers')
    const dezAnosAtras = new Date()
    dezAnosAtras.setFullYear(dezAnosAtras.getFullYear() - 10)
    const iso = dezAnosAtras.toISOString().slice(0, 10)
    expect(calcularIdade(iso)).toBe('10 anos')
  })

  it('formatDiagnosticoMedicoAluno monta texto a partir do laudo', async () => {
    const { formatDiagnosticoMedicoAluno } = await import('./paeeExportHelpers')
    const txt = formatDiagnosticoMedicoAluno({
      ...alunoBase,
      laudos: [{ codigoCid: 'F84', nomeMedico: 'Dr. X', descricao: 'TEA' }],
    })
    expect(txt).toBe('CID: F84 — TEA — Médico: Dr. X')
  })
})
