import { describe, it, expect } from 'vitest'
import { computeDashboardInsights, saudacaoPorHorario, contarFusoesEstudoPaee } from './dashboardInsights'
import dayjs from 'dayjs'

describe('dashboardInsights', () => {
  it('saudacaoPorHorario retorna texto por faixa horária', () => {
    expect(saudacaoPorHorario(new Date('2026-01-01T09:00:00'))).toBe('Bom dia')
    expect(saudacaoPorHorario(new Date('2026-01-01T15:00:00'))).toBe('Boa tarde')
    expect(saudacaoPorHorario(new Date('2026-01-01T21:00:00'))).toBe('Boa noite')
  })

  it('conta fusões estudo+PAEE por aluno', () => {
    const n = contarFusoesEstudoPaee(
      [{ id: 1, nomeCompleto: 'Ana', responsavel: { nome: 'R' }, estado: 'SP' }],
      [{ id: 10, apelido: 'PAEE', dataInicio: '2026-01-01', dataFim: '2026-12-31', descicaoPlanejamento: '', alunos: [{ id: 1, nomeCompleto: 'Ana' }] }],
      [{ id: 5, alunoId: 1, alunoNomeCompleto: 'Ana', titulo: 'EC', updatedAt: '2026-01-01', possuiTextoSimulado: true }]
    )
    expect(n).toBe(1)
  })

  it('calcula métricas e alertas com dados mínimos', () => {
    const ref = dayjs('2026-05-15')
    const result = computeDashboardInsights({
      alunos: [{ id: 1, nomeCompleto: 'João', responsavel: { nome: 'Mãe' }, estado: 'SP' }],
      escolas: [{ id: 1, nomeInstituicao: 'Escola A', idProfessor: 1 }],
      planejamentos: [],
      avaliacoes: [],
      estudosCaso: [],
      relatos: [],
      ref,
    })
    expect(result.metrics).toHaveLength(4)
    expect(result.alunosSemEstudo).toHaveLength(1)
    expect(result.alerts.some((a) => a.id === 'sem-estudo')).toBe(true)
  })

  it('calcula atividade recente sem quebrar quando updatedAt vem ausente', () => {
    const ref = dayjs('2026-05-15')
    const result = computeDashboardInsights({
      alunos: [],
      escolas: [],
      planejamentos: [],
      avaliacoes: [
        {
          id: 1,
          titulo: 'Av 1',
          dataAplicacao: '2026-05-10',
          escolaId: 1,
          quantidadeAlunos: 1,
          quantidadeBlocos: 1,
          concluida: false,
          status: 'EmAndamento',
          createdAt: '2026-05-10',
          updatedAt: undefined as unknown as string,
        },
      ],
      estudosCaso: [],
      relatos: [],
      ref,
    })
    expect(result.recent.some((r) => r.kind === 'avaliacao')).toBe(true)
  })

  it('inclui dados de gráficos', () => {
    const ref = dayjs('2026-05-15')
    const result = computeDashboardInsights({
      alunos: [{ id: 1, nomeCompleto: 'João', responsavel: { nome: 'M' }, estado: 'SP' }],
      escolas: [],
      planejamentos: [],
      avaliacoes: [],
      estudosCaso: [],
      relatos: [{ id: 1, alunoId: 1, alunoNome: 'João', dataSessao: '2026-05-14', presencaPresente: true, tipoOcorrencia: 0, avancos: [], dificuldades: [] }],
      ref,
      completionByStep: { escola: false, aluno: true, 'estudo-caso': false, avaliacao: false, paee: false, relatos: true },
    })
    expect(result.charts.relatosPorSemana).toHaveLength(6)
    expect(result.charts.volumeRecursos.some((v) => v.label === 'Alunos' && v.value === 1)).toBe(true)
  })
})
