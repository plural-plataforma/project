// src/types/userTypes.ts
export interface Usuario {
  idUsuario: number // ou 'id' se preferir padronizar
  nomeCompleto: string
  email: string
  telefone?: number
  perfil?: 'Admin' | 'Professor' | undefined | string;
  roles?: string[];
  ativo: boolean
  isEmbaixadora: boolean
  idNivelEnsino?: number
  possuiLockout: boolean
  statusConta: string
  expirationDate?: string | null
}
