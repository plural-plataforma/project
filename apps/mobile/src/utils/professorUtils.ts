import { Professor } from '../types/professor';

export const isCadastroCompleto = (professor: Professor): boolean => {
  return !!(
    professor.nomeCompleto?.trim() &&
    professor.sexo &&
    professor.email?.trim() &&
    (professor.telefone?.replace(/\D/g, '').length ?? 0) >= 10 &&
    (Array.isArray(professor.escolas) ? professor.escolas.length > 0 : false) &&
    professor.aceitouTermos
    // adicione outros campos obrigatórios aqui
  );
};