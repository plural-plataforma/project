// src/screens/avaliacao-diagnostica/criacao/_layout.tsx
import { Stack } from 'expo-router';
import { ProgressProvider } from './context/ProgressContext'; // contexto para progresso

export default function CriacaoLayout() {
  return (
    <ProgressProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="criacao/step1-identificacao" />
        <Stack.Screen name="step2-alunos" />
        <Stack.Screen name="step3-areas" />
        <Stack.Screen name="step4-atividades" />
        <Stack.Screen name="preview" />
      </Stack>
    </ProgressProvider>
  );
}