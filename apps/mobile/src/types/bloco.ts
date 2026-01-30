import { Atividade, UIAtividade } from "./atividades"

export interface Bloco {
    titulo: string
    ordem: number
    observacao?: string
    status: boolean
}

export interface BlocoComAtividade {
    id: number
    titulo: string
    ordem: number
    observacao?: string
    status: boolean
    atividades: Atividade[]
}
export interface BlocoArea {
  id: number;
  titulo: string;
  atividades: UIAtividade[];
}

export interface BlocoUI {
  id: number
  titulo: string
  atividades: UIAtividade[]
}

export interface BlocoComAtividadeResponse {
  sucesso: boolean
  mensagens: string[]
  listaObjetos: BlocoComAtividade[]
}
