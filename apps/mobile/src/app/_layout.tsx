import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../context/AuthContext'

// Impede que a tela de splash desapareça antes das fontes carregarem
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular: require('@/packages/ui/assets/fonts/Nunito-Regular.ttf'),
    Nunito_700Bold: require('@/packages/ui/assets/fonts/Nunito-Bold.ttf')
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('Timeout: Fontes não carregaram em 5 segundos');
      SplashScreen.hideAsync();
    }, 5000);

    if (fontsLoaded || fontError) {
      clearTimeout(timer);
      console.log('Fontes carregadas:', fontsLoaded, 'Erro:', fontError);
      SplashScreen.hideAsync();
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);



  // Agora o condicional só faz o return
  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
