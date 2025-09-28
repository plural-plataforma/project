<<<<<<< HEAD
import { Text } from 'react-native'

export default function Login() {
  return <Text>Login</Text>
}
=======
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import { View, StyleSheet, Text } from 'react-native'
import {
  InputField,
  LinkButton,
  CheckboxWithLabel,
  AuthButton,
  SignupLink,
  Logo,
  DividerWithText
} from '@/packages/ui/components'
import { navigate } from 'expo-router/build/global-state/routing'

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
  return (
    <View style={styles.appContainer}>
      <View style={styles.container}>
        <Logo />
        <Text style={styles.text}>Seja bem vindo!</Text>
        <InputField label="E-mail" placeholder="Informe seu e-mail" />
        <InputField
          label="Senha"
          placeholder="Informe sua senha"
          secureTextEntry={true}
        />
        <View style={styles.checkboxRow}>
          <CheckboxWithLabel label="Lembrar-me" />
          <LinkButton title="Esqueci minha senha?" onPress={() => {}} />
        </View>
        <AuthButton title="Entrar" onPress={() => {}} />
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
            navigate('auth/signUp')
          }}
        />
      </View>
    </View>
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
  }
})

export default Login
>>>>>>> 51fe25d65a4986d951f44b633b0b17e73155ce4d
