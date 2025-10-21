import { useState } from 'react'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import {
  InputField,
  LinkButton,
  CheckboxWithLabel,
  AuthButton,
  SignupLink,

  DividerWithText
} from '@/packages/ui/components'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { login as authLogin } from '../../services/auth' // authLogin é o service
import { LoginCredentials } from '../../types/auth'
import CustomButton from '../../components/CustomButton'
import { useAuth } from '../../context/AuthContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Logo from '../../components/Logo'
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';



export default function LoginScreen() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    senha: ''
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth() // Context login espera string (token)
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();

  const handleLogin = async () => {
    setLoading(true);
    setError(''); 

    try {
      const response = await authLogin(credentials);

      if (!response.token) {
        const msg = 'Token não recebido da API. Tente novamente.';
        console.error('❌ Sem token na resposta:', response);
        throw new Error(msg);
      }

      await new Promise(resolve => setTimeout(resolve, 200)); // Aguarda estado propagar
      router.replace('/dashboard');

      login(response.token);


      // Verifica se o token foi salvo antes de navegar
      const savedToken = await AsyncStorage.getItem('authToken');
      if (!savedToken || savedToken !== response.token) {
        console.error('⚠️ Token não salvo ou difere:', { savedToken, expected: response.token });
        throw new Error('Falha ao salvar o token.');
      }

      showAlert('Sucesso', 'Login realizado!');
      router.replace('/dashboard');
    } catch (err) {
      console.error('❌ Erro no handleLogin:', err);
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      showAlert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <ScrollView>
        <View style={styles.container}>
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
            <Logo width={248} height={87.29} />
          </View>
          <Text style={styles.text}>Seja bem-vindo!</Text>
          <View style={{ padding: 0 }}>
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
          </View>
          {/**  <View style={styles.checkboxRow}>
            <CheckboxWithLabel label="Lembrar-me" checked={true} onPress={() => { }} />
            <LinkButton title="Esqueci minha senha?" onPress={() => { }} />
          </View>
           */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CustomButton
            title="Entrar"
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
            buttonColor={{ backgroundColor: colors.primary2 }}
          />

          <CustomAlert
            visible={visible}
            title={config.title}
            message={config.message}
            buttons={config.buttons}
            onDismiss={handleDismiss}
          />
        </View>
        {/**  <View style={styles.authSection}>
          <DividerWithText text="Entre com" />
          <AuthButton
            title="Google"
            onPress={() => { }}
            iconName="google"
            isGoogle={true}
          />
          <SignupLink
            onPress={() => {
              router.push('/auth/signUp')
            }}
            labelQuestion="Não tem uma conta?"
            labelAction="Inscreva-se"
          />
        </View>
         */}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  appContainer: {
    width: "100%",
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    alignSelf: 'center',
    width: '90%', // ou o valor desejado
    gap: 16 // <-- adicione isso
  },
  text: {
    color: colors.primary,
    textAlign: 'center',
    margin: 12,
    fontSize: fontSizes.f30,
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
