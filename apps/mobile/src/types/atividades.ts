
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

interface AtividadeDetalhe {
  id: number;
  titulo: string;
  enunciado: string;
  nivel: string;
  etapaMin?: string | null;
  etapaMax?: string | null;
  imagemUrl?: string | null;
  habilidadeIds: number[];
  areaTitulo: string;
}