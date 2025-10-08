import {
  AuthButton,
  CheckboxWithLabel,
  DividerWithText,
  InputField,
  Logo,
  SignupLink
} from '@/packages/ui/components'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import CustomButton from '../../components/CustomButton'
import {login as authLogin, register as authRegister } from '../../services/auth'
import { LoginCredentials, RegisterCredentials } from '../../types/auth'
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
import ButtonBack from '@src/components/ButtonBack'
export default function SignUp() {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    senha: '',
    nomeCompleto: '',
    isCheckTerms: false
  });
  const [error, setError] = useState<string>('');
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [termosAceitos, setTermosAceitos] = useState(false);

const handleRegister = async () => {
  setLoading(true);
  setError('');
  setErrosValidacao([]);
  console.log('🔥 handleRegister chamado com:', credentials);

  // Validação frontend opcional
  if (credentials.senha.length < 8) {
    setError('Senha deve ter pelo menos 8 caracteres');
    setLoading(false);
    return;
  }

  //Aceite dos termos 
  if (!credentials.isCheckTerms) {
  Alert.alert('Atenção', 'Você precisa aceitar os termos para continuar.');
  setLoading(false);
  return;
}
  try {
    const response = await authRegister(credentials);
    console.log('✅ Registro retornou:', response);

    if (response.success) {
      // Exibe a mensagem da API em um alerta usando as credenciais originais
      Alert.alert(
        'Sucesso!',
        response.message || 'Usuário criado com sucesso',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                // Usa as credenciais originais para login
                const loginResult = await authLogin({
                  email: credentials.email,
                  senha: credentials.senha
                });
                if (loginResult.token) {
                  login(loginResult.token); // Passa apenas string
                  console.log('🔑 Login bem-sucedido, redirecionando para /dashboard');
                  router.replace('/dashboard');
                } else {
                  throw new Error('Token não recebido após login.');
                }
              } catch (loginError) {
                console.error('❌ Erro no login após registro:', loginError);
                Alert.alert('Erro', 'Falha ao realizar login após registro. Tente novamente.');
              }
            }
          }
        ]
      );
    } else {
      throw new Error('Falha inesperada no registro');
    }
  } catch (err) {
    const mensagem = (err as Error).message;
    console.error('❌ Erro no handleRegister:', err);

    if (mensagem.includes('\n')) {
      const listaErros = mensagem.split('\n').filter(Boolean);
      setErrosValidacao(listaErros);
      Alert.alert('Erros de Validação', mensagem, [{ text: 'OK' }]);
    } else {
      setError(mensagem);
    }
  } finally {
    setLoading(false);
  }
};

  // Render de erros: lista vermelha abaixo dos inputs
  const renderErros = () => {
    if (errosValidacao.length === 0 && !error) return null;
    return (
      <View style={styles.errosContainer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {errosValidacao.map((erro, index) => (
          <Text key={index} style={styles.errorItem}>{`• ${erro}`}</Text>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <ScrollView >
        <View style={styles.appHeader}>
        <ButtonBack />
          <Logo styles={{logo:styles.logo}} width={172} height={60.54}/>
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
            <CheckboxWithLabel label="Aceito os termos e a política de privacidade" checked={credentials.isCheckTerms}onPress={() =>
    setCredentials(prev => ({
      ...prev,
      termosAceitos: !prev.isCheckTerms
    }))
  }/>
          </View>
          {renderErros()}
          <View style={styles.button}>
          <CustomButton
            title="Cadastrar"
            onPress={handleRegister}
            buttonColor={{ backgroundColor: colors.primary2 }}
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
                router.back();
              }}
              labelQuestion="Já tem uma conta?"
              labelAction="Entrar"
              
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    alignSelf: 'center',
    marginTop:37,
  },
appHeader:{
  flexDirection:'row'
},
  button:{
    margin:9
  },
    logo:{
    flex:1
  },
  groupContainer: {
    width: '100%',
    marginTop:57,
  },
  title: {
    color: colors.primary,
    paddingLeft: 10,
    fontSize: fontSizes.f30,
    fontWeight: '400' as const,
    fontFamily: 'Nunito_400Regular'
  },
  checkboxRow: {},
  authSection: {
    alignItems: 'center',
    flex:1,
    marginTop:20
  },
  error: { color: 'red', marginBottom: 10 },
  errosContainer: {
    marginTop: 5,
    paddingHorizontal: 10
  },
  errorItem: {
    color: 'red',
    fontSize: 14,
    marginBottom: 3
  }
});