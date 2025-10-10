import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Image, StyleSheet, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/packages/ui/theme/theme'
import { Button, Logo } from '@/packages/ui/components'


export default function Index() {
  const router = useRouter()
  


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@/packages/ui/assets/images/home_people.png')}
          style={{ width: '120%', height: '56%', alignSelf:'center' }}
        />
      <View style={{ width: "100%", flexDirection: "row", justifyContent: 'center', marginTop: 20 }}>
        <Logo width={278} height={98} styles={{logo:{ alignSelf: 'center' }}}href="logo-contrast" />
        </View>
        <View style={styles.slugan}>
          <Text
            style={{
              color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32
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
          onPress={() => router.push('/auth/login')}
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
          onPress={() => router.push('/auth/signUp')}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary2
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
      marginTop: 16,
  marginBottom: 24,
  paddingHorizontal: 20,
  alignItems: 'center'
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
