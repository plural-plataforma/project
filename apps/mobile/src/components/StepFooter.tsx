// src/screens/avaliacao-diagnostica/criacao/components/StepFooter.tsx
import { View, Text } from 'react-native';
import CustomButton from '@src/components/CustomButton';
import { useProgress } from '../app/avaliacaoDiagnostica/criacao/context/ProgressContext';

interface Props {
  onNext: () => void;
  onPrevious?: () => void;
  disableNext?: boolean;
  isLastStep?: boolean;
}

export default function StepFooter({ onNext, onPrevious, disableNext, isLastStep }: Props) {
  const { goToPrevious, currentStep, totalSteps } = useProgress();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
      {currentStep > 1 && (
        <CustomButton 
          title="Anterior" 
          onPress={onPrevious || goToPrevious} 
          variant="outline"
        />
      )}
      <CustomButton 
        title={isLastStep ? "Gerar Avaliação" : "Próxima Etapa"} 
        onPress={onNext} 
        disabled={disableNext}
        variant="primary"
      />
    </View>
  );
}