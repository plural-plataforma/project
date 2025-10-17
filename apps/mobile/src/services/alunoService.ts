import { Aluno, AlunoResponse } from '@src/types/aluno';
import { api } from '../services/auth';

export const buscarAlunoPorId = async (idAluno: number): Promise<Aluno> => {
  try {
    const response = await api.get<AlunoResponse>('/Aluno/buscar/' + idAluno);
    console.log('✅ Resposta de buscarAlunoPorId:', response.data);
    if (response.data.sucesso && response.data.objeto) {
      return response.data.objeto as unknown as Aluno;
    }
    throw new Error('Aluno não encontrado');
  } catch (error) {
    console.error('❌ Erro ao buscar aluno por ID:', error);
    throw error;
  }
};

export const buscarAlunos = async (): Promise<Aluno[]> => {
  try {
    const response = await api.get<AlunoResponse>('/Aluno/buscar');
    console.log('✅ Resposta de buscarAlunos:', response.data);
    let alunos: Aluno[] = [];
    if (response.data.sucesso) {
      // Prioriza 'objeto' se for array (como no seu JSON)
      if (Array.isArray(response.data.objeto)) {
        alunos = response.data.objeto;
      } else if (Array.isArray(response.data.listaObjetos)) {
        alunos = response.data.listaObjetos;
      }
    }
    return alunos;
  } catch (error) {
    console.error('❌ Erro ao buscarAlunos:', error);
    return [];
  }
};

export const cadastraAluno = async (alunoData: Partial<Aluno>): Promise<Aluno> => {
  try {
    // Mapeamento reverso para formato da API
    const payload: Partial<Aluno> = {
      ...alunoData,
      nivelEnsino: alunoData.nivelEscolar ? alunoData.nivelEscolar.toString() : '', // Mapeia para string
      turno: alunoData.turno ? alunoData.turno.toString() : '', // Converte para string se necessário
    };

    // Limpa o telefone para enviar apenas números
    const telefoneNumerico = payload.telefone
      ? parseInt(payload.telefone.replace(/\D/g, ''), 10)
      : null;

    // Garante que o telefone seja um número ou nulo
    if (telefoneNumerico && isNaN(telefoneNumerico)) {
      throw new Error('O número de telefone é inválido.');
    }

    const finalPayload = {
      ...payload,
      telefone: telefoneNumerico,
    };

    // Aninha o payload dentro de alunoDTO, como o backend parece esperar
    const response = await api.post<AlunoResponse>('/Aluno/cadastro', finalPayload );
    console.log('✅ Resposta de cadastraAluno:', response.data);
    if (response.data.sucesso && response.data.objeto) {
      return response.data as unknown as Aluno;
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao cadastrar aluno');
  } catch (error) {
    console.error('❌ Erro ao salvar aluno:', error);
    throw error;
  }
};

export const atualizaAluno = async (alunoData: Partial<Aluno>): Promise<Aluno> => {
  try {
    if (!alunoData.id || alunoData.id === 0) {
      throw new Error('ID do aluno é obrigatório para atualização.');
    }

    // Mapeamento reverso para formato da API
    const payload: Partial<Aluno> = {
      ...alunoData,
      nivelEnsino: alunoData.nivelEscolar ? alunoData.nivelEscolar.toString() : '', // Mapeia para string
      turno: alunoData.turno ? alunoData.turno.toString() : '', // Converte para string se necessário
    };

    // Limpa o telefone para enviar apenas números (consistente com cadastro)
    const telefoneNumerico = payload.telefone
      ? parseInt(payload.telefone.replace(/\D/g, ''), 10)
      : null;

    if (telefoneNumerico && isNaN(telefoneNumerico)) {
      throw new Error('O número de telefone é inválido.');
    }

    const finalPayload = {
      ...payload,
      telefone: telefoneNumerico,
    };

    // Aninha o payload dentro de alunoDTO, similar ao cadastro
    const response = await api.patch<AlunoResponse>('/Aluno/atualizar', finalPayload );
    console.log('✅ Resposta de atualizaAluno:', response.data);
    if (response.data.sucesso && response.data.objeto) {
      return response.data as unknown as Aluno;
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar aluno');
  } catch (error: any) {
    console.error('❌ Erro ao atualizar aluno:', error);
    throw error;
  }
};