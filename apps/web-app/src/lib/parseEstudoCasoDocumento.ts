import { sanitizarTextoEstudoCaso } from '@/lib/sanitizarTextoEstudoCaso'

export type LinhaEstudoCasoTipo =
  | 'titulo-doc'
  | 'subtitulo'
  | 'metadados'
  | 'secao'
  | 'subsecao'
  | 'bullet'
  | 'corpo'
  | 'vazio'

export interface LinhaEstudoCaso {
  tipo: LinhaEstudoCasoTipo
  texto: string
}

export interface MetadadoEstudoCaso {
  chave: string
  valor: string
}

export interface SecaoEstudoCaso {
  numero: string
  titulo: string
  linhas: LinhaEstudoCaso[]
}

export interface EstudoCasoDocumentoParseado {
  tituloDoc: string
  subtitulo: string
  metadados: MetadadoEstudoCaso[]
  secoes: SecaoEstudoCaso[]
}

export function classificarLinhaEstudoCaso(
  line: string,
  proximaESubtitulo = false
): LinhaEstudoCasoTipo {
  const t = line.trim()
  if (!t) return 'vazio'
  if (t.startsWith('***')) return 'vazio'
  if (t.startsWith('ESTUDO DE CASO')) return 'titulo-doc'
  if (t === '---') return 'vazio'
  if (/^\d+\.\s/.test(t)) return 'secao'
  if (
    /^(Barreiras observadas|Potencialidades identificadas|Objetivos do AEE|Estratégias|Recursos|Encaminhamentos):/.test(
      t
    )
  )
    return 'subsecao'
  if (t.startsWith('•')) return 'bullet'
  if (t.startsWith('Estudante:') || t.startsWith('Escola:')) return 'metadados'
  if (proximaESubtitulo) return 'subtitulo'
  return 'corpo'
}

export function parseMetadadosLinha(linha: string): MetadadoEstudoCaso[] {
  return linha
    .split('|')
    .map((parte) => {
      const idx = parte.indexOf(':')
      if (idx === -1) return { chave: parte.trim(), valor: '' }
      return {
        chave: parte.slice(0, idx).trim(),
        valor: parte.slice(idx + 1).trim(),
      }
    })
    .filter((m) => m.chave.length > 0)
}

const SECAO_REGEX = /^(\d+)\.\s*(.+)$/

function extrairSecao(texto: string): { numero: string; titulo: string } | null {
  const match = texto.match(SECAO_REGEX)
  if (!match) return null
  return { numero: match[1], titulo: match[2].trim() }
}

export function parseEstudoCasoDocumento(texto: string): EstudoCasoDocumentoParseado {
  const linhasBrutas = sanitizarTextoEstudoCaso(texto).split(/\r?\n/)
  const metadados: MetadadoEstudoCaso[] = []
  const secoes: SecaoEstudoCaso[] = []
  let tituloDoc = 'ESTUDO DE CASO — AEE'
  let subtitulo = ''
  let proximaESubtitulo = false
  let secaoAtual: SecaoEstudoCaso | null = null

  for (const line of linhasBrutas) {
    let tipo = classificarLinhaEstudoCaso(line, proximaESubtitulo)
    const t = line.trim()

    if (tipo === 'titulo-doc') {
      tituloDoc = t
      proximaESubtitulo = true
      continue
    }

    if (tipo === 'subtitulo' || (tipo === 'corpo' && proximaESubtitulo && t)) {
      if (!subtitulo) subtitulo = t
      proximaESubtitulo = false
      continue
    }

    proximaESubtitulo = false

    if (tipo === 'metadados') {
      metadados.push(...parseMetadadosLinha(t))
      continue
    }

    if (tipo === 'secao') {
      const info = extrairSecao(t)
      if (info) {
        secaoAtual = { numero: info.numero, titulo: info.titulo, linhas: [] }
        secoes.push(secaoAtual)
      }
      continue
    }

    if (tipo === 'vazio') continue

    const linha: LinhaEstudoCaso = { tipo, texto: t }
    if (secaoAtual) {
      secaoAtual.linhas.push(linha)
    } else if (!subtitulo && tipo === 'corpo') {
      subtitulo = t
    }
  }

  return { tituloDoc, subtitulo, metadados, secoes }
}

export function linhaEhPlaceholder(texto: string): boolean {
  return /\[Completar/i.test(texto)
}

function extrairConteudoBullet(texto: string): string {
  return texto.replace(/^•\s*/, '')
}

export function converterSecaoParaTextoCorrido(secao: SecaoEstudoCaso): SecaoEstudoCaso {
  const linhas: LinhaEstudoCaso[] = []
  let grupoAtual: string[] = []

  const flush = () => {
    if (grupoAtual.length > 0) {
      linhas.push({ tipo: 'corpo', texto: grupoAtual.join(' ') })
      grupoAtual = []
    }
  }

  for (const linha of secao.linhas) {
    if (linha.tipo === 'bullet') {
      grupoAtual.push(extrairConteudoBullet(linha.texto))
      continue
    }
    if (linha.tipo === 'corpo') {
      grupoAtual.push(linha.texto)
      continue
    }
    flush()
    linhas.push(linha)
  }
  flush()

  return { ...secao, linhas }
}
