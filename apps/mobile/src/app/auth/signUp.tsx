import {
  AuthButton,
  CheckboxWithLabel,
  DividerWithText,
  InputField,
  Logo,
  SignupLink
} from '@/packages/ui/components'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import CustomButton from '@src/components/CustomButton'
import { register as authRegister } from '../../services/auth'
import { RegisterCredentials } from '../../types/auth'
import { useRouter } from 'expo-router'
import { CaretLeft } from 'phosphor-react-native'
import { useState } from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'

export default function SignUp() {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    senha: '',
    nomeCompleto: ''
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleRegister = async () => {
    setLoading(true)
    console.log(credentials)
    try {
      const response = await authRegister(credentials) // Seu auth.login
      login(response.token) // Set no context
      Alert.alert('Sucesso', 'Login realizado!')
      router.replace('/dashboard') // Ou deixe o context redirecionar
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <SafeAreaView style={styles.appContainer}>
      <ScrollView>
        <View style={styles.appTopBar}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.back()
            }}
          >
            <CaretLeft
              size={32}
              color={colors.primary}
              style={{ margin: 8, marginRight: 4, marginLeft: 4 }}
            />
          </TouchableOpacity>
          <Logo width={172} height={60.54} />
        </View>
        <View style={styles.groupContainer}>
          <Text style={styles.title}>Crie sua conta</Text>
          <InputField
            label="Nome de usuário"
            placeholder="Seu nome de usuário"
            value={credentials.nomeCompleto}
            onChangeText={text =>
              setCredentials({ ...credentials, nomeCompleto: text })
            }
          />
          <InputField
            label="Email"
            placeholder="Seu e-mail"
            value={credentials.email}
            onChangeText={text =>
              setCredentials({ ...credentials, email: text })
            }
            keyboardType="email-address"
          />

          <InputField
            label="Senha"
            placeholder="Informe sua senha"
            value={credentials.senha}
            onChangeText={text =>
              setCredentials({ ...credentials, senha: text })
            }
            keyboardType="email-address"
            secureTextEntry={true}
          />
          <InputField
            label="Escola/Instituição"
            placeholder="Nome da Escola/Instituição"
          />

          <View style={styles.checkboxRow}>
            <CheckboxWithLabel label="Aceito os termos e a política de privacidade" />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <CustomButton
            title="Cadastrar"
            onPress={handleRegister}
            buttonColor={{ backgroundColor: colors.tertiary }}
            disabled={loading}
            loading={loading}
          />
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
                router.back()
              }}
              labelQuestion="Já tem uma conta?"
              labelAction="Entrar"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1
  },
  appTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    gap: 30,
    paddingHorizontal: 12
  },
  button: {
    backgroundColor: '#fff',
    width: '7%',
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 12,
    opacity: 0.6,
    height: 40,
    borderColor: colors.primary,
    borderRadius: 8
  },
  groupContainer: {
    width: '90%',
    alignSelf: 'center'
  },
  title: {
    color: colors.primary,
    paddingTop: 20,

    fontSize: fontSizes.xxxl,
    fontWeight: '400' as const,
    fontFamily: 'Nunito_400Regular'
  },
  checkboxRow: {},
  authSection: {
    alignItems: 'center'
  },
  error: { color: 'red', marginBottom: 10 }
})
