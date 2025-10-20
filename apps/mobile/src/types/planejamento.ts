import { Aluno } from "./aluno";
import { Habilidade } from "./habilidade";

export interface Planejamento {
    id: number;
    apelido: string;
    dataInicio: string;
    dataFim: string;
    
    habilidades: Habilidade[];
    aluno: Aluno[];
    
}

export interface PlanejamentoVinculaAluno {
    idPlanejamento: number;
    idAluno: number;
}

export interface PlanejamentoVinculaHabilidade {
    idPlanejamento: number;
    idHabilidade: number;

}

export interface PlanejamentoResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Planejamento | null;
  listaObjetos: Planejamento[]; // Para listas (ex.: buscarAlunos)
}