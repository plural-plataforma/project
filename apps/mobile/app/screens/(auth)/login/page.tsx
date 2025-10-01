import { useState } from 'react'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native'
import {
  InputField,
  LinkButton,
  CheckboxWithLabel,
  AuthButton,
  SignupLink,
  Logo,
  DividerWithText
} from '@/packages/ui/components'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { login } from '../../../services/auth'
import { LoginCredentials } from '../../../types/auth'
import CustomButton from '@app/components/CustomButton'

export default function LoginScreen() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    senha: ''
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    console.log(credentials)
    try {
      await login(credentials)
      Alert.alert('Sucesso', 'Login realizado!')
      router.replace('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <View style={styles.container}>
        <Logo width={248} height={87.29} />
        <Text style={styles.text}>Seja bem vindo!</Text>
        <InputField
          label="E-mail"
          placeholder="Informe seu e-mail"
          value={credentials.email}
          onChangeText={text => setCredentials({ ...credentials, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <InputField
          label="Senha"
          placeholder="Informe sua senha"
          value={credentials.senha}
          onChangeText={text => setCredentials({ ...credentials, senha: text })}
          secureTextEntry={true}
          autoCapitalize="none"
        />
        <View style={styles.checkboxRow}>
          <CheckboxWithLabel label="Lembrar-me" />
          <LinkButton title="Esqueci minha senha?" onPress={() => {}} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <CustomButton
          title="Entrar"
          onPress={handleLogin}
          disabled={loading}
          loading={loading}
        />
      </View>
      <View style={styles.authSection}>
        <DividerWithText text="Entre com" />
        <AuthButton
          title="Google"
          onPress={() => {}}
          iconName="google"
          isGoogle={true}
        />
        <SignupLink
          onPress={() => {
            router.push('screens/(auth)/signUp/page')
          }}
          labelQuestion="Não tem uma conta?"
          labelAction="Inscreva-se"
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  container: {
    width: '72%',
    alignSelf: 'center'
  },
  text: {
    color: colors.primary,
    paddingTop: 20,
    margin: 12,
    fontSize: fontSizes.xxxl,
    fontWeight: '400' as const,
    fontFamily: 'Nunito_400Regular'
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    margin: 0,
    padding: 0
  },
  authSection: {
    alignItems: 'center'
  },
  error: { color: 'red', marginBottom: 10 }
})
