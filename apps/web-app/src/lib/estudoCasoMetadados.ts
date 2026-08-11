/**
 * Seção de identificação institucional/cadastro que passa a aparecer no Estudo de
 * Caso exportado (Word/PDF) e no visualizador da tela, logo abaixo do nome do
 * aluno. Fonte única de conteúdo — viewer, exportador docx e exportador pdf
 * consomem esta mesma função, cada um só aplicando sua própria estilização.
 */

export interface EstudoCasoMetadadosCampo {
  label: string
  valor: string
}

export interface EstudoCasoMetadadosSecao {
  titulo: string
  campos?: EstudoCasoMetadadosCampo[]
  texto?: string
}

export interface EstudoCasoMetadadosInput {
  escolaNomeInstituicao?: string | null
  professorNomeCompleto?: string | null
  alunoDataNascimento?: string | null // "yyyy-MM-dd"
  alunoAno?: string | null
  updatedAt: string // ISO datetime
  diagnosticoRecenteResumo?: string
  contextoSituacao: string
}

function calcularIdade(dataNascimentoIso: string): number | null {
  const nascimento = new Date(`${dataNascimentoIso}T12:00:00`)
  if (Number.isNaN(nascimento.getTime())) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversario) idade -= 1
  return idade >= 0 ? idade : null
}

function formatarGeradoEmUtc(updatedAt: string): string {
  const data = new Date(updatedAt)
  if (Number.isNaN(data.getTime())) return 'não disponível'
  return data.toISOString().slice(0, 16).replace('T', ' ')
}

export function montarCamposIdentificacao(input: EstudoCasoMetadadosInput): EstudoCasoMetadadosCampo[] {
  const campos: EstudoCasoMetadadosCampo[] = [
    { label: 'Instituição de ensino', valor: input.escolaNomeInstituicao?.trim() || 'não informado' },
    {
      label: 'Logotipo da instituição',
      valor:
        'não há campo de URL no cadastro da escola nesta versão — utilize o modelo oficial da rede, se existir.',
    },
    {
      label: 'Professor(a) responsável (cadastro)',
      valor: input.professorNomeCompleto?.trim() || 'não informado',
    },
  ]

  if (input.alunoDataNascimento) {
    const idade = calcularIdade(input.alunoDataNascimento)
    const dataFormatada = new Date(`${input.alunoDataNascimento}T12:00:00`).toLocaleDateString('pt-BR')
    campos.push({
      label: 'Data de nascimento',
      valor:
        idade != null
          ? `${dataFormatada}. Idade cronológica aproximada: ${idade} anos.`
          : dataFormatada,
    })
  } else {
    campos.push({ label: 'Data de nascimento', valor: 'não informada no cadastro' })
  }

  campos.push({ label: 'Ano/série (cadastro)', valor: input.alunoAno?.trim() || 'não informado' })
  campos.push({ label: 'Gerado em (UTC)', valor: formatarGeradoEmUtc(input.updatedAt) })

  return campos
}

export function montarSecoesIdentificacao(input: EstudoCasoMetadadosInput): EstudoCasoMetadadosSecao[] {
  return [
    { titulo: 'Identificação institucional e cadastro', campos: montarCamposIdentificacao(input) },
    {
      titulo: 'Recorte do diagnóstico mais recente (avaliação diagnóstica na plataforma)',
      texto: input.diagnosticoRecenteResumo?.trim() || '—',
    },
    {
      titulo: 'Contexto relatado pela equipe',
      texto: input.contextoSituacao?.trim() || '—',
    },
  ]
}
