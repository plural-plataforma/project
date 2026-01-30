
type Nivel = "Facil" | "Medio" | "Dificil"
export interface Atividade {

    id: number
    titulo: string
    enunciado: string
    blocoId: number
    nivel: Nivel
    etapaMin: string
    etapaMax: string
    imagemUrl: string
    ativo: boolean
    habilidadeIds: number[]
}

export interface UIAtividade {
  id: number
  descricao: string
}

export interface AtividadeResponse {
  sucesso: boolean
  mensagens: string[]
  listaObjetos: Atividade[]
}
