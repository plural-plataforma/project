// Dashboard.tsx atualizado (apenas o useEffect e o botão)
import * as React from 'react'
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { Text } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { colors } from '@/packages/ui/theme/theme'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import CustomButton from '../../components/CustomButton'
import { useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'

export default function Dashboard() {
  const router = useRouter()
  const { isLoggedIn, loading: authLoading, logoutLoading } = useAuth() // Adicione logoutLoading
  const { signOut } = useAuth()

  // Remova o redirecionamento daqui — signOut já faz!
  useEffect(() => {
    console.log(
      `🔍 useEffect: authLoading=${authLoading}, isLoggedIn=${isLoggedIn}`
    ) // Log a cada mudança
    if (!authLoading && !isLoggedIn) {
      console.log('🚀 useEffect detectou !isLoggedIn, redirecionando...') // Se ativar
      // Não chame router.replace aqui (evita duplicata), mas logue se quiser
    }
  }, [isLoggedIn, authLoading])

  if (authLoading)
    return <ActivityIndicator size="large" color={colors.primary} /> // Spinner só para loading inicial

  return (
    <View style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/packages/ui/assets/images/logo.png')}
            style={[styles.logo]}
          />
          <Text style={styles.text}>
            Plural <Text style={styles.textSecondary}>PLATAFORMA</Text>
          </Text>
        </View>
        <View style={styles.headerRight}></View>
      </View>
      <SafeAreaProvider>
        <SafeAreaView edges={['top']}>
          <ScrollView>
            <Text>Bem-vindo à Plural Plataforma!</Text>
            <CustomButton
              title={'Professor'}
              onPress={() => {
                router.push('/professor')
              }}
            />
            <CustomButton
              title={logoutLoading ? 'Saindo...' : 'Sair'} // Muda texto durante loading
              onPress={() => {
                console.log('🖱️ Botão Sair clicado!') // Confirma clique
                Alert.alert(
                  'Sair da conta?',
                  'Isso invalidará sua sessão e você precisará fazer login novamente.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Sair',
                      onPress: () => {
                        console.log('✅ Confirmação de sair aceita!') // Confirma Alert
                        signOut() // Chama o signOut
                      }
                    }
                  ]
                )
              }}
              disabled={logoutLoading} // Desabilita botão durante processo
              // Se CustomButton tiver prop loading, use: loading={logoutLoading}
            />
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  )
}
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },

  header: {
    backgroundColor: colors.tertiary,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold'
  },
  textSecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
    textTransform: 'uppercase'
  },
  logo: {
    width: 42.79,
    height: 33.65,
    marginRight: 10
  }
})
