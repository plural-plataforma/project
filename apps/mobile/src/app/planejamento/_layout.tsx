import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function PdiLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MeusPlanejamentos" options={{ headerShown: false }} />
        <Stack.Screen name="PlanejamentoScreen" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}
