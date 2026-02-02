// src/screens/avaliacao-diagnostica/criacao/context/CreationContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { BlocoSelecionadoDTO } from '@src/types/avaliacao-diagnostica';

type CreationData = {
  titulo: string;
  objetivo: string;
  dataAplicacao: string;
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
};

const CreationContext = createContext<CreationContextType | undefined>(undefined);

export const CreationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CreationData>(initialData);

  const updateData = (newData: Partial<CreationData>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const resetData = () => setData(initialData);

  return (
    <CreationContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </CreationContext.Provider>
  );
};

export const useCreation = () => {
  const context = useContext(CreationContext);
  if (!context) throw new Error('useCreation deve ser usado dentro de CreationProvider');
  return context;
};