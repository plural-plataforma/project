// src/screens/avaliacao-diagnostica/criacao/_layout.tsx
import { Stack } from 'expo-router';
import { ProgressProvider } from './context/ProgressContext'; // contexto para progresso
import { CreationProvider } from './context/CreationContext';

export default function CriacaoLayout() {
  return (
    <ProgressProvider>
      <CreationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="criacao/step1-identificacao" />
        <Stack.Screen name="step2-alunos" />
        <Stack.Screen name="step3-areas" />
        <Stack.Screen name="step4-preview" />
        <Stack.Screen
          name="detailsAtividades"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
            gestureEnabled: true,
          }}
        />
      </Stack>
      </CreationProvider>
    </ProgressProvider>
  );
}