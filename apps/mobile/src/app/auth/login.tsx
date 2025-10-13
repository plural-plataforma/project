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
import { login as authLogin } from '../../services/auth' // authLogin é o service
import { LoginCredentials } from '../../types/auth'
import CustomButton from '../../components/CustomButton'
import { useAuth } from '../../context/AuthContext'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function LoginScreen() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    senha: ''
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth() // Context login espera string (token)

  const handleLogin = async () => {
    setLoading(true);
    setError(''); // Limpa erro anterior
    console.log('🔍 Iniciando login com credenciais:', credentials);

    try {
      console.log('📤 Chamando authLogin do serviço...');
      const response = await authLogin(credentials);
      console.log('✅ Resposta do authLogin:', response);

      if (!response.token) {
        const msg = 'Token não recebido da API. Tente novamente.';
        console.error('❌ Sem token na resposta:', response);
        throw new Error(msg);
      }

      await new Promise(resolve => setTimeout(resolve, 200)); // Aguarda estado propagar
      router.replace('/dashboard');
      console.log('🔑 Chamando context.login com token:', response.token);
      login(response.token);
      console.log('🎉 Context login chamado, isLoggedIn deve ser true agora');

      // Verifica se o token foi salvo antes de navegar
      const savedToken = await AsyncStorage.getItem('authToken');
      if (!savedToken || savedToken !== response.token) {
        console.error('⚠️ Token não salvo ou difere:', { savedToken, expected: response.token });
        throw new Error('Falha ao salvar o token.');
      }

      Alert.alert('Sucesso', 'Login realizado!');
      console.log('➡️ Navegando para /dashboard...');
      router.replace('/dashboard');
      console.log('🚀 Navegação executada!');
    } catch (err) {
      console.error('❌ Erro no handleLogin:', err);
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      Alert.alert('Erro', errorMsg);
    } finally {
      setLoading(false);
      console.log('🏁 Fim do handleLogin, loading=false');
    }
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <ScrollView>
        <View style={styles.container}>
          <Logo width={248} height={87.29} />
          <Text style={styles.text}>Seja bem vindo!</Text>
          <View style={{ flex: 1, padding: 0 }}>
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
          <View style={styles.checkboxRow}>
            <CheckboxWithLabel label="Lembrar-me" checked={true} onPress={() => { }} />
            <LinkButton title="Esqueci minha senha?" onPress={() => { }} />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <CustomButton
            title="Entrar"
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
            buttonColor={{ backgroundColor: colors.primary2 }}
          />

        </View>
        <View style={styles.authSection}>
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

  },
  text: {
    color: colors.primary,

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
