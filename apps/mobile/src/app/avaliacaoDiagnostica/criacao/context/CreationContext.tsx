// src/screens/avaliacao-diagnostica/criacao/context/CreationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

import { buscarAvaliacaoPorId } from '@src/services/avaliacaoDiagnosticaService';
import { BlocoSelecionadoDTO } from '@src/types/avaliacao-diagnostica';

type CreationData = {
  id?: number;
  titulo: string;
  objetivo: string;
  dataAplicacao: string;           // formato 'YYYY-MM-DD'
  escolaId?: number;
  alunoIds: number[];
  blocos: BlocoSelecionadoDTO[];
};

const initialData: CreationData = {
  titulo: '',
  objetivo: '',
  dataAplicacao: '',
  escolaId: undefined,
  alunoIds: [],
  blocos: [],
};

type CreationContextType = {
  data: CreationData;
  updateData: (newData: Partial<CreationData>) => void;
  resetData: () => void;
  dataVersion: number;
  avaliacaoId: number | null;
  isEditing: boolean;
  isLoading: boolean;
  startCreation: () => void;
  startEditing: (id: number) => Promise<void>;
  setAvaliacaoId: (id: number | null) => void;
};

const CreationContext = createContext<CreationContextType | undefined>(undefined);

export const CreationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CreationData>(initialData);
  const [dataVersion, setDataVersion] = useState(0);
  const [avaliacaoId, setAvaliacaoIdState] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const params = useLocalSearchParams<{ avaliacaoId?: string }>();

  // Carrega automaticamente se vier ID na rota (ex: /criacao/[avaliacaoId])
  useEffect(() => {
    const idFromParams = params.avaliacaoId ? Number(params.avaliacaoId) : null;
    if (idFromParams && !isNaN(idFromParams) && idFromParams !== avaliacaoId) {
      startEditing(idFromParams);
    }
  }, [params.avaliacaoId, avaliacaoId]); // Dependência extra evita loop infinito

  const updateData = useCallback((newData: Partial<CreationData>) => {
    setData((prev) => ({ ...prev, ...newData }));
    setDataVersion((v) => v + 1);
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
    setDataVersion(0);
    setAvaliacaoIdState(null);
    setIsEditing(false);
    setIsLoading(false);
  }, []);

  const startCreation = useCallback(() => {
    resetData();
  }, [resetData]);

  const startEditing = useCallback(async (id: number) => {
    if (id === avaliacaoId) return;

    setIsLoading(true);
    setIsEditing(true);
    setAvaliacaoIdState(id);

    try {
      const response = await buscarAvaliacaoPorId(id);
      const detalhes = response.objeto;

      updateData({
        id: detalhes.id,
        titulo: detalhes.titulo ?? '',
        objetivo: detalhes.objetivo ?? '',
        dataAplicacao: detalhes.dataAplicacao
          ? new Date(detalhes.dataAplicacao).toISOString().split('T')[0]
          : '',
        escolaId: detalhes.escolaId ?? undefined,

        alunoIds: detalhes.alunoIds ?? [],

        blocos: detalhes.blocosComAtividades?.map((b) => ({
          blocoId: b.id,
          atividadeIds: b.atividades?.map((a) => a.id) ?? [],
        })) ?? [],
      });

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [avaliacaoId]);

  const setAvaliacaoId = useCallback((id: number | null) => {
    setAvaliacaoIdState(id);
    setIsEditing(id !== null);
  }, []);

  return (
    <CreationContext.Provider
      value={{
        data,
        updateData,
        resetData,
        dataVersion,
        avaliacaoId,
        isEditing,
        isLoading,
        startCreation,
        startEditing,
        setAvaliacaoId,
      }}
    >
      {children}
    </CreationContext.Provider>
  );
};

export const useCreation = () => {
  const context = useContext(CreationContext);
  if (!context) {
    throw new Error('useCreation deve ser usado dentro de CreationProvider');
  }
  return context;
};