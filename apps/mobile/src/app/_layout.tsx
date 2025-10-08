import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../context/AuthContext'
import { Platform } from 'react-native'
import * as NavigationBar from 'expo-navigation-bar'

// Impede que a tela de splash desapareça antes das fontes carregarem
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular: require('@/packages/ui/assets/fonts/Nunito-Regular.ttf'),
    Nunito_700Bold: require('@/packages/ui/assets/fonts/Nunito-Bold.ttf')
  })

  // ✅ SEMPRE fora de blocos condicionais
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  // ✅ Também fora de qualquer if
  useEffect(() => {
    const hideNavigationBar = async () => {
      if (Platform.OS === 'android') {
        console.log('Tentando ocultar a barra de navegação no layout raiz...')
        try {
          await NavigationBar.setVisibilityAsync('hidden')
          console.log('Barra de navegação ocultada com sucesso no layout raiz.')
        } catch (error) {
          console.error('Erro ao ocultar barra de navegação no layout raiz:', error)
        }
      }
    }

    hideNavigationBar()
  }, [])

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
