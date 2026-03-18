import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function PdiLayout() {
    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MinhasAvaliacoes" options={{ title: 'Avaliações Diagnósticas' }} />
            </Stack>
        </SafeAreaProvider>
    )
}
