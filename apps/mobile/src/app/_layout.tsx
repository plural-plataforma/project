import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../context/AuthContext'
import { Platform } from 'react-native'
import * as NavigationBar from 'expo-navigation-bar';

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

useEffect(() => {
    const hideNavigationBar = async () => {
      if (Platform.OS === 'android') {
        console.log('Tentando ocultar a barra de navegação no layout raiz...');
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          console.log('Barra de navegação ocultada com sucesso no layout raiz.');
        } catch (error) {
          console.error('Erro ao ocultar barra de navegação no layout raiz:', error);
        }
      }
    };

    hideNavigationBar();
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        
      </AuthProvider>
    </SafeAreaProvider>
  )
}
