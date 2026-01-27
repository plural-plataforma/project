export interface AtividadeCreateInput {
  titulo: string;
  enunciado?: string;
  blocoId: number;          // obrigatório, ID do bloco associado
  nivel: string;            // ex: "Básico", "Intermediário", "Avançado"
  etapaMin: string;         // ex: "EI - Educação Infantil"
  etapaMax?: string;        // opcional
  habilidadesIds: number[]; // array de IDs das habilidades
  imagemUrl?: string;            // arquivo binário da imagem (multipart)
}


// Resposta esperada do POST (ajuste conforme o backend retorna)
export interface Atividade {
  id: number;
  titulo: string;
  enunciado?: string;
  blocoId: number;
  nivel: string;
  etapaMin: string;
  etapaMax?: string;
  imagemUrl?: string;       // URL da imagem após upload
  habilidadeIds: number[];
  status: boolean;
  createdAt: string;
  updatedAt?: string;
  ativo: boolean;
}

export interface AtividadeResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: null;
  listaObjetos: Atividade[];
}