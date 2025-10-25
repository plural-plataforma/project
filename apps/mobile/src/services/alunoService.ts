import { Aluno, AlunoResponse } from '@src/types/aluno';
import { api } from '../services/auth';

export const buscarAlunoPorId = async (idAluno: number): Promise<Aluno> => {
  try {
    const response = await api.get<AlunoResponse>('/Aluno/buscar/' + idAluno);
  
    if (response.data.sucesso && response.data.objeto) {
      // Bate com o tipo: objeto é Aluno[] para consistência, pega o primeiro
      if (Array.isArray(response.data.objeto) && response.data.objeto.length > 0) {
        return response.data.objeto[0];
      } else if (typeof response.data.objeto === 'object' && response.data.objeto !== null) {
        // Caso retorne objeto único (não array)
        return response.data.objeto as unknown as Aluno;
      }
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
    let alunos: Aluno[] = [];
    if (response.data.sucesso) {
      // Prioriza 'objeto' se for array (como no seu JSON)
      if (Array.isArray(response.data.objeto)) {
        alunos = response.data.objeto;
      } else if (response.data.listaObjetos && Array.isArray(response.data.listaObjetos)) {
        // Fallback para listaObjetos se objeto não for array
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
      nivelEnsino: alunoData.nivelEnsino ? alunoData.nivelEnsino.toString() : '', // Mapeia para string
      turno: alunoData.turno ? alunoData.turno.toString() : '', // Converte para string se necessário
    };

    const response = await api.post<AlunoResponse>('/Aluno/cadastro', payload);

    // FIX: Verifica só 'sucesso' primeiro; se true, considera salvo (mesmo com objeto null)
    if (response.data.sucesso) {
      if (response.data.objeto) {
        // Se objeto existe, usa ele (como array ou single)
        if (Array.isArray(response.data.objeto) && response.data.objeto.length > 0) {
          return response.data.objeto[0];
        } else {
          return response.data.objeto as unknown as Aluno;
        }
      } else {
        // FIX: Se objeto é null (mas sucesso=true), retorna os dados de entrada como "salvo"
        const savedAluno: Aluno = {
          ...payload as Aluno, // Converte Partial para Aluno completo
          id: 0, // ID gerado no backend; ajuste se exposto em outro campo
        };
        return savedAluno;
      }
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao cadastrar aluno');
  } catch (error) {
    console.error('❌ Erro ao cadastrar aluno:', error);
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
      nivelEnsino: alunoData.nivelEnsino ? alunoData.nivelEnsino.toString() : '', // Mapeia para string
      turno: alunoData.turno ? alunoData.turno.toString() : '', // Converte para string se necessário
    };

    const response = await api.patch<AlunoResponse>('/Aluno/atualizar', payload);

    // FIX: Verifica só 'sucesso' primeiro; se true, considera salvo (mesmo com objeto null)
    if (response.data.sucesso) {
      if (response.data.objeto) {
        // Se objeto existe, usa ele (como array ou single)
        if (Array.isArray(response.data.objeto) && response.data.objeto.length > 0) {
          return response.data.objeto[0];
        } else {
          return response.data.objeto as unknown as Aluno;
        }
      } else {
        // FIX: Se objeto é null (mas sucesso=true), retorna os dados de entrada como "salvo"
        const updatedAluno: Aluno = {
          ...payload as Aluno, // Converte Partial para Aluno completo
          id: alunoData.id, // Mantém o ID existente
        };
        return updatedAluno;
      }
    }
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar aluno');
  } catch (error: any) {
    console.error('❌ Erro ao atualizar aluno:', error);
    throw error;
  }
};