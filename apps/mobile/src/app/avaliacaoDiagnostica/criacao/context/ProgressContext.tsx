// src/screens/avaliacao-diagnostica/criacao/context/ProgressContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'expo-router';
import { STEP_ORDER, StepName } from '../stepsOrder';

const ProgressContext = createContext<{
  currentStep: number;
  totalSteps: number;
  goToNext: () => void;
  goToPrevious: () => void;
  reset: () => void;
} | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // ex: /avaliacao-diagnostica/criacao/step3-areas
  const totalSteps = STEP_ORDER.length;

  // Extrai o nome da etapa da URL atual
  const getCurrentStepFromPath = () => {
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1] as StepName;
    const index = STEP_ORDER.indexOf(lastSegment);
    return index !== -1 ? index + 1 : 1; // 1-based (1 de 5)
  };

  const [currentStep, setCurrentStep] = useState(getCurrentStepFromPath());

  // Atualiza automaticamente toda vez que a rota muda (incluindo voltar)
  useEffect(() => {
    const newStep = getCurrentStepFromPath();
    setCurrentStep(newStep);
  }, [pathname]);

  const goToNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      // Navegação opcional: router.push(next route)
    }
  };

  const goToPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      // Navegação opcional: router.back()
    }
  };

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