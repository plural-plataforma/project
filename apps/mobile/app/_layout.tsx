import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

// Impede que a tela de splash desapareça antes das fontes carregarem
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    //'assets/fonts/Nunito-Regular.ttf'
    Nunito_400Regular: require('@/packages/ui/assets/fonts/Nunito-Regular.ttf'),
    Nunito_700Bold: require('@/packages/ui/assets/fonts/Nunito-Bold.ttf')
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Esconde a tela de splash quando as fontes estiverem prontas
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  // Não renderiza nada até que as fontes estejam carregadas
  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/home" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signUp" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  )
}
