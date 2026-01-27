import { Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../context/AuthContext'
import { CustomAlert, useCustomAlert } from '@src/hooks/useCustomAlert'
import Constants from 'expo-constants'
import { ProfileProvider } from '@src/context/ProfileContext'

// Impede que a tela de splash desapareça antes das fontes carregarem
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular: require('@packages/ui/assets/fonts/Nunito-Regular.ttf'),
    Nunito_700Bold: require('@packages/ui/assets/fonts/Nunito-Bold.ttf'),
    Nunito_SemiBold: require('@packages/ui/assets/fonts/Nunito-SemiBold.ttf')
  })

  const { visible, config, handleDismiss } = useCustomAlert();

  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('Timeout: Fontes não carregaram em 5 segundos');
      SplashScreen.hideAsync();
      console.log('API_URL:', Constants.expoConfig?.extra?.API_URL);
    }, 5000);

    if (fontsLoaded || fontError) {
      clearTimeout(timer);
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
        <ProfileProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <CustomAlert
            visible={visible}
            title={config.title}
            message={config.message}
            buttons={config.buttons}
            onDismiss={handleDismiss}
          />
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider >
  )
}
