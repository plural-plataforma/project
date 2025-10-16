import { Aluno, AlunoResponse } from '@src/types/aluno';
import { api } from '../services/auth';

export const buscarAlunoPorId = async (idAluno: number): Promise<Aluno> => {
  try {
    const response = await api.get<{ objeto: Aluno[], mensagens: string[], sucesso: boolean }>(`/Aluno/buscar/${idAluno}`);
    console.log('✅ Resposta de buscarEscolaPorId:', response.data);
    if (response.data.sucesso && Array.isArray(response.data.objeto) && response.data.objeto.length > 0) {
      return response.data.objeto[0];
    }
    throw new Error('Aluno não encontrada');
  } catch (error) {
    console.error('❌ Erro ao buscar escola por ID:', error);
    throw error;
  }
};
export const buscarAlunos = async (): Promise<Aluno[]> => {
  try {
    const response = await api.get<AlunoResponse>('/Aluno/buscar');
    console.log('✅ Resposta de buscarAlunos:', response.data);
    return Array.isArray(response.data.objeto) ? response.data.objeto : [];
  } catch (error) {
    console.error('❌ Erro ao buscarAlunos:', error);
    return [];
  }
};

export const cadastraAluno = async (alunoData: Partial<Aluno>): Promise<Aluno> => {
  try {
    // Limpa o telefone para enviar apenas números
    const telefoneNumerico = alunoData.telefone
      ? parseInt(alunoData.telefone.replace(/\D/g, ''), 10)
      : null;

    // Garante que o telefone seja um número ou nulo
    if (telefoneNumerico && isNaN(telefoneNumerico)) {
      throw new Error('O número de telefone é inválido.');
    }

    const payload = {
      ...alunoData,
      telefone: telefoneNumerico,
    };

    // Aninha o payload dentro de alunoDTO, como o backend parece esperar
    const response = await api.post('/Aluno/cadastro', { alunoDTO: payload });
    console.log('✅ Resposta de cadastraAluno:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao salvar aluno:', error);
    throw error;
  }
};