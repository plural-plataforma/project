// src/types/userTypes.ts
export interface Usuario {
  idUsuario: number // ou 'id' se preferir padronizar
  nome: string
  email: string
  telefone?: number
  perfil: 'ADMIN' | 'PROFESSOR' | 'RESPONSAVEL' | 'OUTRO' | string
  ativo: boolean
  isEmbaixadora: boolean
  idNivelEnsino?: number
}
