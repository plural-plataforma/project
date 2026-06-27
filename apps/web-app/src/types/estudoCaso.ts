export interface EstudoCasoEixoCatalogo {
  id: number
  codigo: string
  rotulo: string
  descricaoHint?: string | null
  ordemExibicao: number
}

export interface EstudoCasoItemEixoPayload {
  eixoCatalogoId: number
  anotacao?: string | null
}

export interface EstudoCasoCadastroRequest {
  alunoId: number
  titulo: string
  contextoSituacao: string
  potencialidades?: string | null
  itensEixo: EstudoCasoItemEixoPayload[]
}

export interface EstudoCasoAtualizacaoRequest {
  titulo: string
  contextoSituacao: string
  potencialidades?: string | null
  itensEixo: EstudoCasoItemEixoPayload[]
}

export interface EstudoCasoItemDetalhe extends EstudoCasoItemEixoPayload {
  codigoEixo: string
  rotuloEixo: string
}

export interface EstudoCasoDetalhe {
  id: number
  alunoId: number
  alunoNomeCompleto: string
  titulo: string
  contextoSituacao: string
  potencialidades?: string | null
  textoSimulado?: string | null
  createdAt: string
  updatedAt: string
  itensEixo: EstudoCasoItemDetalhe[]
}

export interface EstudoCasoListaItem {
  id: number
  alunoId: number
  alunoNomeCompleto: string
  titulo: string
  updatedAt: string
  possuiTextoSimulado: boolean
}
