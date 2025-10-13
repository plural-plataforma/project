import { Aluno } from '@src/types/aluno';
import { api } from '../services/auth';

export  const buscarAlunoPorId = async (id: number) => {
  return api.get<Aluno>(`/alunos/${id}`).then(response => response.data);
}

export const atualizarAluno = async (id: number, alunoData: Partial<Aluno>) =>{
  return api.patch<Aluno>(`/alunos/${id}`, alunoData).then(response => response.data);
}

export const buscarMeusAlunos = async (idProf: number) => {
  return api.get<Aluno[]>(`/professores/${idProf}/alunos`).then(response => response.data);
}