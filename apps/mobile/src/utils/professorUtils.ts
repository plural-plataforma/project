import { Professor } from '../types/professor';

export const isCadastroCompleto = (professor: Professor): boolean => {
  console.log('Verificando cadastro completo para o professor:', professor);
  const camposObrigatorios = [
    professor.nomeCompleto,
    professor.cep,
    professor.logradouro,
    professor.numero,
    professor.bairro,
    professor.estado,
    professor.cidade,
    professor.telefone,
    // professor.disciplinas,
    // professor.nivelEnsino,
    // professor.sobre,
  ];

  // Considera o cadastro completo se nenhum campo obrigatório for null/undefined/empty,
  // aceitouTermos for true, e escolas for um array não vazio
  return (
    camposObrigatorios.every((campo) => campo != null && campo !== '') // &&
   // professor.aceitouTermos === true &&
    //professor.escolas.length > 0
  );
};