import dayjs from 'dayjs'
import {
  atualizarPlanejamento,
  buscarObjetivosPaeeCatalogo,
  cadastrarPlanejamento,
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

  const catalogo = await buscarObjetivosPaeeCatalogo()
  const curto = catalogo.find((c) => c.prazo === 'Curto')
  const medio = catalogo.find((c) => c.prazo === 'Medio')
  const longo = catalogo.find((c) => c.prazo === 'Longo')

  let objCurto = curto?.textoModelo ?? ''
  if (estudo.contextoSituacao.trim()) {
    objCurto = objCurto
      ? `${objCurto}\n\nContexto do estudo: ${estudo.contextoSituacao.trim().slice(0, 400)}`
      : estudo.contextoSituacao.trim().slice(0, 600)
  }

  await atualizarPlanejamento({
    id: plano.id,
    apelido: plano.apelido,
    dataInicio: plano.dataInicio,
    dataFim: plano.dataFim,
    descicaoPlanejamento: plano.descicaoPlanejamento,
    objetivoCurtoPrazo: objCurto || null,
    objetivoMedioPrazo: medio?.textoModelo ?? null,
    objetivoLongoPrazo: longo?.textoModelo ?? null,
    objetivoCurtoCatalogoId: curto?.id ?? null,
    objetivoMedioCatalogoId: medio?.id ?? null,
    objetivoLongoCatalogoId: longo?.id ?? null,
  })

  return { ...plano, apelido, dataInicio, dataFim }
}
