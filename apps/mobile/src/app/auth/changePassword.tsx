import { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSizes } from '@/packages/ui/theme/theme';
import { InputField } from '@/packages/ui/components';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { trocarSenha } from '../../services/auth'; // Importe o service
import Logo from '../../components/Logo';
import { useCustomAlert } from '@src/hooks/useCustomAlert';

export default function ChangePasswordScreen() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { trocarSenhaConcluida, userToken } = useAuth(); // Pega o token atual do contexto
  const { showAlert } = useCustomAlert();

  const handleTrocarSenha = async () => {
    setLoading(true);
    setError('');

    try {
      if (novaSenha !== confirmarNovaSenha) {
        throw new Error('As novas senhas não coincidem');
      }

      // Chama o service (pode precisar do token no header, já que interceptor adiciona)
      const response = await trocarSenha({ senhaAtual, novaSenha });

      if (!response.success) {
        throw new Error('Falha ao trocar senha');
      }

      // Atualiza o contexto (remove flag)
      trocarSenhaConcluida();

      showAlert('Sucesso', 'Senha trocada com sucesso! Você agora pode acessar o app.', [
        { text: 'OK', onPress: () => router.replace('/dashboard') }
      ]);

    } catch (err) {
      console.error('❌ Erro ao trocar senha:', err);
      const errorMsg = (err as Error).message;
      setError(errorMsg);
      showAlert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
          <Logo width={248} height={87.29} />
        </View>
        <Text style={styles.title}>Troque sua senha</Text>
        <Text style={styles.subtitle}>
          Para sua segurança, troque a senha padrão da plataforma.
        </Text>

        <InputField
          label="Senha Atual"
          placeholder="Digite sua senha atual"
          value={senhaAtual}
          onChangeText={setSenhaAtual}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        <InputField
          label="Nova Senha"
          placeholder="Digite uma nova senha (mín. 8 caracteres)"
          value={novaSenha}
          onChangeText={setNovaSenha}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        <InputField
          label="Confirmar Nova Senha"
          placeholder="Confirme a nova senha"
          value={confirmarNovaSenha}
          onChangeText={setConfirmarNovaSenha}
          secureTextEntry={true}
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}


        <View style={{ flexDirection:'row', padding: 30}}> 
        <CustomButton
          title="Trocar Senha"
          onPress={handleTrocarSenha}
          disabled={loading}
          loading={loading}
          buttonColor={{ backgroundColor: colors.primary2 }}
        />

        {/* Botão de voltar/cancelar, se quiser permitir */}
        <CustomButton
          title="Cancelar"
          onPress={() => router.back()} // Ou signOut se quiser forçar
          disabled={loading}
          buttonColor={{ backgroundColor: colors.primary }}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
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
    marginHorizontal:80
  },
  error: {
    color: colors.danger,
    marginBottom: 10,
    textAlign: 'center',
  },
  button:{
    padding:20
  }
});