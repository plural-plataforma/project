// app/home.tsx
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Image, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/packages/ui/theme/theme'
import { Button, Logo } from '@/packages/ui/components'

export default function Home() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@/packages/ui/assets/images/home_people.png')}
          style={{ width: '120%', height: '56%' }}
        />
        <Logo width={279.64} height={98.42} href="logo-contrast" />
        <View style={styles.slugan}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 24,
              fontWeight: '700'
            }}
          >
            Onde cada <Text style={{ color: '#A786B6' }}>aluno</Text> importa,
            cada <Text style={{ color: '#A786B6' }}>progresso</Text> conta.
          </Text>
        </View>
        <Button
          title="Acessar"
          buttonColor={{
            color: colors.textPrimary,
            backgroundColor: colors.textPrimary
          }}
          textColor={[
            styles.buttonText,
            {
              color: colors.textSecondary
            }
          ]}
          onPress={() => router.push('screens/(auth)/login/page')}
        />

        <Button
          title="Criar Conta"
          buttonColor={{
            color: colors.textPrimary,
            backgroundColor: colors.background
          }}
          textColor={[
            styles.buttonText,
            {
              color: colors.textPrimary
            }
          ]}
          onPress={() => router.push('screens/(auth)/signUp/page')}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tertiary
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40
  },
  slugan: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  button: {
    width: '80%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600'
  }
})
