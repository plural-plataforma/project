import { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSizes } from '@/packages/ui/theme/theme';
import { InputField } from '@/packages/ui/components';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { trocarSenha } from '../../services/auth';
import Logo from '../../components/Logo';
import { useCustomAlert } from '@src/hooks/useCustomAlert';
import ButtonBack from '@src/components/ButtonBack';
import { useForm, Controller } from 'react-hook-form'; // Adicionei setValue para limpar campos
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordData } from '../../schemas/auth'; // Importa schema separado

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false); // Mantém loading separado
  const router = useRouter();
  const { trocarSenhaConcluida, userToken } = useAuth();
  const { showAlert } = useCustomAlert();

  // Configura o form com validação
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmarNovaSenha: '',
    },
    mode: 'onChange', // Valida em tempo real
  });

  const onSubmit = async (data: ChangePasswordData) => {
    setLoading(true);

    try {
      const response = await trocarSenha({ senhaAtual: data.senhaAtual, novaSenha: data.novaSenha });

      if (!response.success) {
        throw new Error('Falha ao trocar senha');
      }

      trocarSenhaConcluida(); // Atualiza estado e remove flag

      // Mensagem de sucesso com redirect manual no OK + auto após 2s
      showAlert('Sucesso', 'Senha trocada com sucesso! Você agora pode acessar o app.', [
        { text: 'OK', onPress: () => router.replace('/dashboard') }
      ]);

      // Auto-redirect após 2s (caso usuário ignore alerta)
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);

      // Limpa form para próxima vez (opcional)
      setValue('senhaAtual', '');
      setValue('novaSenha', '');
      setValue('confirmarNovaSenha', '');

    } catch (err: any) {
      console.error('❌ Erro ao trocar senha:', err);
      let errorMsg = err.message || 'Erro desconhecido';

      // Tratamento específico para erros comuns
      if (errorMsg.includes('Incorrect password') || errorMsg.includes('senha atual incorreta')) {
        errorMsg = 'Senha atual incorreta. Verifique e tente novamente.';
        setValue('senhaAtual', ''); // Limpa só este campo
      } else if (errorMsg.includes('diferente da atual')) {
        errorMsg = 'A nova senha deve ser diferente da atual.';
      }

      showAlert('Erro', errorMsg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.appHeader}>
          <ButtonBack />
          <Logo styles={{ logo: styles.logo }} width={172} height={60.54} />
        </View>
        <Text style={styles.title}>Troque sua senha</Text>
        <Text style={styles.subtitle}>
          Para sua segurança, troque a senha padrão da plataforma.
        </Text>

        {/* Campo Senha Atual */}
        <Controller
          control={control}
          name="senhaAtual"
          render={({ field: { onChange, value } }) => (
            <View>
              <InputField
                label="Senha Atual"
                placeholder="Digite sua senha atual (do login)"
                value={value}
                onChangeText={onChange}
                secureTextEntry={true}
                autoCapitalize="none"
                error={errors.senhaAtual?.message} // Erro específico
                errorStyle={styles.error}
              />
            </View>
          )}
        />

        {/* Campo Nova Senha */}
        <Controller
          control={control}
          name="novaSenha"
          render={({ field: { onChange, value } }) => (
            <View>
              <InputField
                label="Nova Senha"
                placeholder="Digite uma nova senha (mín. 8 caracteres, diferente da atual)"
                value={value}
                onChangeText={onChange}
                secureTextEntry={true}
                autoCapitalize="none"
                error={errors.novaSenha?.message}
                errorStyle={styles.error}
              />
            </View>
          )}
        />

        {/* Campo Confirmar Nova Senha */}
        <Controller
          control={control}
          name="confirmarNovaSenha"
          render={({ field: { onChange, value } }) => (
            <View>
              <InputField
                label="Confirmar Nova Senha"
                placeholder="Confirme a nova senha"
                value={value}
                onChangeText={onChange}
                secureTextEntry={true}
                autoCapitalize="none"
                error={errors.confirmarNovaSenha?.message}
                errorStyle={styles.error}
              />
            </View>
          )}
        />

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Trocar Senha"
            onPress={handleSubmit(onSubmit)} // Só submete se válido
            disabled={loading || !isValid}
            loading={loading}
            buttonColor={{ backgroundColor: colors.primary2 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    flex: 1, // Para centralizar verticalmente
  },
  appHeader: {
    flexDirection: 'row',
  },
  logo: {
    flex: 1
  },
  title: {
    fontSize: fontSizes.f24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.f16,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 30,
    marginHorizontal: 80,
  },
  error: {
    color: colors.danger,
    fontSize: fontSizes.f14,
    marginTop: 4,
    textAlign: 'left', // Alinha com o input
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 30,
    justifyContent: 'center', // Centraliza o botão
    width: '100%',
  },
});