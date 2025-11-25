import { Aluno } from "./aluno";
import { Estrategia } from "./estrategia";
import { Habilidade } from "./habilidade";

export interface Planejamento {
    id: number;
    apelido: string;
    dataInicio: string;
    dataFim: string;
    
    habilidades?: Habilidade[];
    estrategias?: Estrategia[];
    alunos?: Aluno[];
    
}

export interface PlanejamentoAluno {
    id: number;
    apelido: string;
    dataInicio: string;
    dataFim: string;
    habilidades: Habilidade[];
    
}

export interface PlanejamentoVinculaAluno {
    idPlanejamento: number;
    idAluno: number;
}

export interface PlanejamentoVinculaHabilidade {
    idPlanejamento: number;
    idHabilidade: number;
}

export interface PlanejamentoVinculaEstrategia {
    idPlanejamento: number;
    idEstrategia: number;

}

export interface PlanejamentoResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Planejamento | null;
  listaObjetos: Planejamento[]; // Para listas (ex.: buscarAlunos)
}