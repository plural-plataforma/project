import { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,          // <-- ADICIONADO
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSizes } from '@/packages/ui/theme/theme';
import { InputField } from '@/packages/ui/components';
import CustomButton from '@src/components/CustomButton';
import Header from '@src/components/Header';
import { useAuth } from '@src/context/AuthContext';
import { trocarSenha } from '@src/services/auth';
import { useCustomAlert } from '@src/hooks/useCustomAlert';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordSchema,
  type ChangePasswordData,
} from '@src/schemas/auth';

export default function ChangePasswordScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { trocarSenhaConcluida } = useAuth();
  const { showAlert } = useCustomAlert();

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
    mode: 'onChange',
  });

  const onSubmit = async (data: ChangePasswordData) => {
    setLoading(true);
    try {
      const response = await trocarSenha({
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });

      if (!response.success) throw new Error('Falha ao trocar senha');

      trocarSenhaConcluida();

      showAlert('Sucesso', 'Senha alterada com sucesso!', [
        { text: 'OK', onPress: () => router.replace('/dashboard') },
      ]);

      setTimeout(() => router.replace('/dashboard'), 2000);

      setValue('senhaAtual', '');
      setValue('novaSenha', '');
      setValue('confirmarNovaSenha', '');
    } catch (err: any) {
      console.error('Erro ao trocar senha:', err);
      let msg = err.message ?? 'Erro desconhecido';

      if (msg.toLowerCase().includes('incorreta') || msg.includes('incorrect')) {
        msg = 'Senha atual incorreta.';
        setValue('senhaAtual', '');
      } else if (msg.includes('diferente da atual')) {
        msg = 'A nova senha deve ser diferente da atual.';
      }

      showAlert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Redefinir senha" onBack={() => router.back()} fixed={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        {/* -------------------------------------------------
            ScrollView garante que o botão nunca fique fora
            da tela, mesmo em dispositivos pequenos.
           ------------------------------------------------- */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Por favor, digite uma senha que você vai lembrar
          </Text>

          {/* ---- Senha Atual ---- */}
          <Controller
            control={control}
            name="senhaAtual"
            render={({ field: { onChange, value } }) => (
              <InputField
                label="Senha Atual"
                placeholder="Digite sua senha atual"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                autoCapitalize="none"
                error={errors.senhaAtual?.message}
                errorStyle={styles.errorText}
              />
            )}
          />

          {/* ---- Nova Senha ---- */}
          <Controller
            control={control}
            name="novaSenha"
            render={({ field: { onChange, value } }) => (
              <InputField
                label="Nova Senha"
                placeholder="Deve ter 8 caracteres"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                autoCapitalize="none"
                error={errors.novaSenha?.message}
                errorStyle={styles.errorText}
              />
            )}
          />

          {/* ---- Confirmar Nova Senha ---- */}
          <Controller
            control={control}
            name="confirmarNovaSenha"
            render={({ field: { onChange, value } }) => (
              <InputField
                label="Confirme a nova senha"
                placeholder="Digite novamente a senha"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                autoCapitalize="none"
                error={errors.confirmarNovaSenha?.message}
                errorStyle={styles.errorText}
              />
            )}
          />

          {/* ---- Botão (sempre visível) ---- */}
          <View style={styles.buttonWrapper}>
            <CustomButton
              title="Redefinir"
              onPress={handleSubmit(onSubmit)}
              disabled={loading || !isValid}
              loading={loading}
              buttonColor={{ backgroundColor: colors.primary2 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -----------------------------------------------------------------
   ESTILOS – agora o botão tem espaço garantido
   ----------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,   
    flexGrow: 1,             
  },
  subtitle: {
    fontSize: fontSizes.f16,
    fontFamily: 'Nunito_400Regular',
    color: colors.primary,
    textAlign: 'left',
    paddingTop:70,
    paddingBottom:20 
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.f14,
    fontFamily: 'Nunito_400Regular',
    marginTop: 6,
    marginLeft: 4,
  },
  buttonWrapper: {
    marginTop: 32,
    alignItems: 'center'
  }
});