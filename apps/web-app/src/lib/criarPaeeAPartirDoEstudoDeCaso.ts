import dayjs from 'dayjs'
import {
  cadastrarPlanejamento,
  gerarObjetivosPaeeIA,
  vincularAlunosPlanoLote,
  vincularHabilidadesPlanoLote,
} from '@/services/planejamentoService'
import { buscarAvaliacaoPorId, buscarAvaliacoesDiagnosticas } from '@/services/avaliacaoDiagnosticaService'
import { buscarHabilidades } from '@/services/habilidadeService'
import { buscarEixosEstudoCasoCatalogo } from '@/services/estudoCasoService'
import type { EstudoCasoDetalhe } from '@/types/estudoCaso'
import type { Planejamento } from '@/types/planejamento'
import { estudoCasoCatalogoEixosCompleto } from '@/stores/estudoCasoWizardStore'

/** Versão simplificada quando o catálogo não está disponível. */
export function estudoCasoEstaConcluidoHeuristica(estudo: EstudoCasoDetalhe): boolean {
  if ((estudo.textoSimulado ?? '').trim().length > 0) return true
  return estudo.itensEixo.length >= 6
}

export async function estudoCasoEstaConcluidoAsync(estudo: EstudoCasoDetalhe): Promise<boolean> {
  if ((estudo.textoSimulado ?? '').trim().length > 0) return true
  try {
    const eixos = await buscarEixosEstudoCasoCatalogo()
    return estudoCasoCatalogoEixosCompleto(
      eixos.map((e) => e.id),
      estudo.itensEixo.map((i) => i.eixoCatalogoId),
    )
  } catch {
    return estudoCasoEstaConcluidoHeuristica(estudo)
  }
}

async function habilidadesSugeridasParaAluno(alunoId: number): Promise<number[]> {
  const avaliacoes = await buscarAvaliacoesDiagnosticas()
  const candidatas = avaliacoes
    .filter((a) => a.concluida)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  for (const av of candidatas) {
    try {
      const det = await buscarAvaliacaoPorId(av.id)
      const participa = (det.alunos ?? []).some((a) => a.id === alunoId)
      if (!participa) continue
      const perfil = det.perfisAutonomiaPorAluno?.find((p) => p.alunoId === alunoId)
      const texto = perfil?.habilidadesAReenforcar?.trim()
      if (!texto) continue

      const todas = await buscarHabilidades()
      const partes = texto.split(/[,;\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)
      const ids: number[] = []
      for (const parte of partes) {
        const match = todas.find(
          (h) =>
            (h.descricao ?? '').toLowerCase().includes(parte) ||
            (h.resumo ?? '').toLowerCase().includes(parte) ||
            parte.includes((h.resumo ?? '').toLowerCase()),
        )
        if (match && !ids.includes(match.id)) ids.push(match.id)
      }
      if (ids.length > 0) return ids
    } catch {
      continue
    }
  }
  return []
}

export interface CriarPaeeAPartirDoEstudoParams {
  estudo: EstudoCasoDetalhe
}

export async function criarPaeeAPartirDoEstudoDeCaso(
  params: CriarPaeeAPartirDoEstudoParams,
): Promise<Planejamento> {
  const { estudo } = params
  const hoje = dayjs()
  const dataInicio = hoje.format('YYYY-MM-DD')
  const dataFim = hoje.add(1, 'year').format('YYYY-MM-DD')
  const apelido = `PAEE — ${estudo.alunoNomeCompleto}`.slice(0, 120)

  const plano = await cadastrarPlanejamento({
    apelido,
    dataInicio,
    dataFim,
    descicaoPlanejamento: `Gerado a partir do estudo de caso: ${estudo.titulo}`,
  })

  await vincularAlunosPlanoLote(plano.id, [estudo.alunoId])

  const habIds = await habilidadesSugeridasParaAluno(estudo.alunoId)
  if (habIds.length > 0) {
    await vincularHabilidadesPlanoLote(plano.id, habIds)
  }

  // Gerador mecânico (template do catálogo + recorte cru do contexto) temporariamente
  // desativado — objetivos agora vêm da IA, com base no Estudo de Caso, habilidades e
  // estratégias já vinculadas ao plano. Se a IA falhar, o PAEE é criado sem os objetivos
  // preenchidos automaticamente; a professora pode gerar depois ou preencher manualmente
  // na aba de objetivos do plano.
  try {
    await gerarObjetivosPaeeIA(plano.id)
  } catch {
    // Falha silenciosa aqui: a criação do PAEE não deve ser bloqueada por indisponibilidade da IA.
  }

  return { ...plano, apelido, dataInicio, dataFim }
}
