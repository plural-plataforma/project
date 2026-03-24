import { api } from "@/api/http";
import type { Professor, ProfessorResponse } from "@/types/professor";
import type { Escola } from "@/types/escolas";

export const buscarProfessor = async (): Promise<ProfessorResponse> => {
  const response = await api.get<ProfessorResponse>("/Professor/buscar/");
  if (!response.data) throw new Error("Resposta vazia da API");
  return response.data;
};

export const buscarEscolasProfessor = async (): Promise<Escola[]> => {
  const response = await api.get<{ objeto: Escola[] }>(
    "/Professor/buscarescolas",
  );
  if (!response.data || !Array.isArray(response.data.objeto)) {
    throw new Error("Formato inválido da API");
  }
  return response.data.objeto;
};

export const atualizarProfessor = async (
  professorData: Professor,
): Promise<ProfessorResponse> => {
  const payload = { ...professorData, escolas: [] };
  const response = await api.patch<ProfessorResponse>(
    "/Professor/atualizar/",
    payload,
  );
  return response.data;
};

export const vincularEscola = async (idEscola: number) => {
  const response = await api.post("/Professor/vincularescola", { idEscola });
  const data = response.data;
  if (!data.sucesso && !data.mensagens?.includes("já está vinculado")) {
    throw new Error(data.mensagens?.join(", ") || "Falha ao vincular escola");
  }
  return data;
};

export const desvincularEscola = async (idEscola: number) => {
  const response = await api.post("/Professor/desvincularescola", { idEscola });
  const data = response.data;
  if (!data.sucesso && !data.mensagens?.includes("não está vinculado")) {
    throw new Error(
      data.mensagens?.join(", ") || "Falha ao desvincular escola",
    );
  }
  return data;
};

const hasValue = (value: string | null | undefined): boolean => !!value?.trim();

export interface CadastroPendencia {
  key: "nomeCompleto" | "cep" | "estado" | "telefone" | "escola";
  label: string;
}

export const getCadastroPendencias = (
  professor: Partial<Professor> | null | undefined,
  escolasCount: number,
): CadastroPendencia[] => {
  const pendencias: CadastroPendencia[] = [];

  if (!hasValue(professor?.nomeCompleto)) {
    pendencias.push({ key: "nomeCompleto", label: "Nome completo" });
  }
  if (!hasValue(professor?.cep)) {
    pendencias.push({ key: "cep", label: "CEP" });
  }
  if (!hasValue(professor?.estado)) {
    pendencias.push({ key: "estado", label: "Estado" });
  }
  if (!hasValue(professor?.telefone)) {
    pendencias.push({ key: "telefone", label: "Telefone" });
  }
  if (escolasCount <= 0) {
    pendencias.push({ key: "escola", label: "Escola vinculada" });
  }

  return pendencias;
};

export const isCadastroCompleto = (
  professor: Partial<Professor> | null | undefined,
  escolasCount: number,
): boolean => {
  return getCadastroPendencias(professor, escolasCount).length === 0;
};
