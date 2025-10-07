import { Professor } from '../types/professor';

export const isCadastroCompleto = (professor: Professor): boolean => {
  const camposObrigatorios = [
    professor.nomeCompleto,
    professor.cep,
    professor.logradouro,
    professor.numero,
    professor.bairro,
    professor.estado,
    professor.cidade,
    professor.telefone,
    professor.disciplinas,
    professor.nivelEnsino,
    professor.sobre,
    professor.isCheckTerms,
  ];

  // Considera o cadastro completo se nenhum campo obrigatório for null/empty e isCheckTerms for true
  return camposObrigatorios.every((campo) => campo !== null && campo !== '') && professor.isCheckTerms === true;
};