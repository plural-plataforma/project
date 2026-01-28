// src/screens/avaliacao-diagnostica/criacao/context/ProgressContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type ProgressContextType = {
  currentStep: number;
  totalSteps: number;
  goToNext: () => void;
  goToPrevious: () => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // ou 5 se contar preview

  const goToNext = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const goToPrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const reset = () => setCurrentStep(1);

  return (
    <ProgressContext.Provider value={{ currentStep, totalSteps, goToNext, goToPrevious, reset }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress deve ser usado dentro de ProgressProvider');
  return context;
};