
export interface Habilidade{
    id: number;
    nivelEnsino: string;
    tipo: string;
    descricao: string;
    resumo: string
}

export interface AlunoResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: Habilidade[]; 
}