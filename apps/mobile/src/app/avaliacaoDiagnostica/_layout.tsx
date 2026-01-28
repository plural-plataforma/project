import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function PdiLayout() {
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="avaliacaoDiagnostica/index" options={{ title: 'Avaliações Diagnósticas' }} />
                <Stack.Screen name="avaliacaoDiagnostica/criacao" options={{ title: 'Detalhes' }} />
                <Stack.Screen name="avaliacaoDiagnostica/AvaliacaoScreen" options={{ title: 'Detalhes' }} />
            </Stack>
        </SafeAreaProvider>
    )
}
