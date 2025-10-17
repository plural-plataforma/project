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
import { login as authLogin, register as authRegister } from '../../services/auth'
import { LoginCredentials, RegisterCredentials } from '../../types/auth'
import { useRouter } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import ButtonBack from '@src/components/ButtonBack'
import alert from '@src/utils/alert'  // ✅ Usando o componente customizado para web/mobile

export default function SignUp() {
  // Schema de validação com Yup (validação por campo ativada por default no onChange)
  const schema = yup.object({
    nomeCompleto: yup.string().min(2, 'Nome deve ter pelo menos 2 caracteres').required('Nome é obrigatório'),
    email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
    senha: yup.string().min(8, 'Senha deve ter pelo menos 8 caracteres').required('Senha é obrigatória'),
    aceitouTermos: yup.boolean().oneOf([true], 'Você precisa aceitar os termos').required('Você precisa aceitar os termos')
  });

  type FormData = yup.InferType<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',  // ✅ Ativa validação real-time por campo (a cada mudança)
    defaultValues: {
      nomeCompleto: '',
      email: '',
      senha: '',
      aceitouTermos: false
    }
  });

  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setErrosValidacao([]);
    console.log('🔥 handleRegister chamado com:', data);

    try {
      const response = await authRegister(data);
      console.log('✅ Registro retornou:', response);

      if (response.success) {
        alert(  // ✅ Usando o componente customizado
          'Sucesso!',
          response.message || 'Usuário criado com sucesso',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  const loginResult = await authLogin({
                    email: data.email,
                    senha: data.senha
                  } as LoginCredentials);
                  if (loginResult.token) {
                    login(loginResult.token);
                    console.log('🔑 Login bem-sucedido, redirecionando para /dashboard');
                    router.replace('/dashboard');
                  } else {
                    throw new Error('Token não recebido após login.');
                  }
                } catch (loginError) {
                  console.error('❌ Erro no login após registro:', loginError);
                  alert(  // ✅ Usando o componente customizado
                    'Erro',
                    'Falha ao realizar login automático. Faça login manualmente.',
                    [{ text: 'OK', onPress: () => router.navigate('/auth/login') }]
                  );
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
        alert('Erros de Validação', mensagem);  // ✅ Usando o componente customizado (sem buttons, usa default)
      } else {
        alert('Erro', mensagem);  // ✅ Usando o componente customizado (sem buttons, usa default)
      }
    } finally {
      setLoading(false);
    }
  };

  // Render de erros globais (backend)
  const renderErros = () => {
    if (errosValidacao.length === 0) return null;
    return (
      <View style={styles.errosContainer}>
        {errosValidacao.map((erro, index) => (
          <Text key={index} style={styles.errorItem}>{`• ${erro}`}</Text>
        ))}
      </View>
    );
  };

  // Helper para renderizar erro abaixo de cada campo
  const renderFieldError = (errorMessage: string | undefined) => {
    if (!errorMessage) return null;
    return <Text style={styles.fieldError}>{errorMessage}</Text>;
  };

  return (
    <SafeAreaView style={styles.appContainer}>
      <ScrollView>
        <View style={styles.appHeader}>
          <ButtonBack />
          <Logo styles={{ logo: styles.logo }} width={172} height={60.54} />
        </View>
        <View style={styles.groupContainer}>
          <Text style={styles.title}>Crie sua conta</Text>
          
          {/* Nome Completo */}
          <Controller
            control={control}
            name="nomeCompleto"
            render={({ field: { onChange, value } }) => (
              <View>
                <InputField
                  label="Nome de usuário"
                  placeholder="Seu nome de usuário"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.nomeCompleto}
                  errorMessage={errors.nomeCompleto?.message}  // Passa pro InputField se quiser estilizar internamente
                />
                {renderFieldError(errors.nomeCompleto?.message)}  {/* ✅ Erro explícito abaixo */}
              </View>
            )}
          />
          
          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View>
                <InputField
                  label="Email"
                  placeholder="Seu e-mail"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  error={!!errors.email}
                  errorMessage={errors.email?.message}
                />
                {renderFieldError(errors.email?.message)}  {/* ✅ Erro explícito abaixo */}
              </View>
            )}
          />
          
          {/* Senha */}
          <Controller
            control={control}
            name="senha"
            render={({ field: { onChange, value } }) => (
              <View>
                <InputField
                  label="Senha"
                  placeholder="Informe sua senha"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={true}
                  keyboardType="default"
                  error={!!errors.senha}
                  errorMessage={errors.senha?.message}
                />
                {renderFieldError(errors.senha?.message)}  {/* ✅ Erro explícito abaixo */}
              </View>
            )}
          />
          
          {/* Checkbox */}
          <View style={styles.checkboxRow}>
            <Controller
              control={control}
              name="aceitouTermos"
              render={({ field: { onChange, value } }) => (
                <CheckboxWithLabel
                  label="Aceito os termos e a política de privacidade"
                  checked={value}
                  onPress={() => onChange(!value)}
                />
              )}
            />
            {renderFieldError(errors.aceitouTermos?.message)}  {/* ✅ Erro explícito abaixo */}
          </View>
          
          {renderErros()}
          
          <View style={styles.button}>
            <CustomButton
              title="Cadastrar"
              onPress={handleSubmit(onSubmit)}
              buttonColor={{ backgroundColor: colors.primary2 }}
              disabled={isSubmitting || loading}
              loading={isSubmitting || loading}
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
    marginTop: 37
  },
  appHeader: {
    flexDirection: 'row'
  },
  button: {
    margin: 9
  },
  logo: {
    flex: 1
  },
  groupContainer: {
    width: '100%',
    marginTop: 57,
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
    flex: 1,
    marginTop: 20
  },
  fieldError: {  // ✅ Estilo específico para erros por campo (vermelho abaixo)
    color: 'red', 
    marginTop: 2,
    marginBottom: 10,  // Espaço entre campos
    fontSize: 12,
    paddingHorizontal: 10
  },
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