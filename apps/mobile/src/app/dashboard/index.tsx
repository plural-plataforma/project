import * as React from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@packages/ui/theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomButton from '@src/components/CustomButton';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import NotificationBanner from './../../components/NotificationBanner';
import { Backpack, ClipboardText, NoteBlank, SignOut, Users } from 'phosphor-react-native';
import { Professor } from '@src/types/professor';
import { Escola } from '@src/types/escolas';
import { buscarProfessor, buscarEscolasProfessor } from '@src/services/professorService';
import { isCadastroCompleto } from '@src/utils/professorUtils';
import SelectButton from '@src/components/SelectButton';
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importe a função (ajuste o caminho conforme sua estrutura de pastas)
import { adiarTrocaSenha } from '@src/services/auth';  // ← adicione isso

interface SectionItem {
  type: 'banner' | 'tasks';
}

export default function Dashboard() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, logoutLoading, signOut, precisaTrocarSenha } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();

  const [cadastroCompleto, setCadastroCompleto] = useState(false);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [professorEscolas, setProfessorEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) {
      setShouldRedirectToLogin(true);
      return;
    }

    setLoading(true);

    try {
      const data = await buscarProfessor();
      let updatedProfessor: Professor = {
        ...data.objeto,
        escolas: [],
      };

      try {
        const linkedEscolas = await buscarEscolasProfessor();
        updatedProfessor.escolas = linkedEscolas.map(escola => escola.id!.toString());
        setProfessorEscolas(linkedEscolas);
      } catch (error: any) {
        console.error('Erro ao buscar escolas do professor:', error);
        showAlert('Aviso', 'Não foi possível carregar as escolas vinculadas.', [
          { text: 'OK' },
        ]);
        setProfessorEscolas([]);
      }

      setProfessor(updatedProfessor);
      setCadastroCompleto(isCadastroCompleto(updatedProfessor));
    } catch (error: any) {
      console.error('Erro ao carregar dados do professor:', error);

      if (error.message?.includes('401') || error.message?.includes('Nenhum token')) {
        showAlert('Sessão expirada', 'Sua sessão expirou. Faça login novamente.', [
          {
            text: 'OK',
            onPress: async () => {
              await signOut();
              router.replace('/auth/login');
            },
          },
        ]);
      } else {
        showAlert('Erro', 'Não foi possível carregar os dados do professor.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, signOut, router, showAlert]);

  // Redireciona para login se necessário
  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace('/auth/login');
    }
  }, [shouldRedirectToLogin, router]);

  // Carregamento inicial
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      fetchData();
    }
  }, [authLoading, isLoggedIn, fetchData]);

  // Refresh ao voltar para a tela
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        fetchData();
      }
    }, [isLoggedIn, fetchData])
  );

  // ==================== ALERTA DE TROCA DE SENHA ====================
  useEffect(() => {
    if (!precisaTrocarSenha) return;

    const checkAndShowPasswordAlert = async () => {
      const STORAGE_KEY = 'alert_troca_senha_adiado';

      // Se já adiou anteriormente → não mostra mais
      const alreadyAdiado = await AsyncStorage.getItem(STORAGE_KEY);
      if (alreadyAdiado === 'true') return;

      showAlert(
        'Troca de Senha Requerida',
          'Por motivos de segurança, é necessário alterar sua senha antes de continuar.\n\n'+
           'Caso deseje alterar posteriormente, deve acessar Perfil > Preferências',
        [
          {
            text: 'Trocar agora',
            onPress: () => router.replace('/auth/changePassword'),
          },
          {
            text: 'Não, obrigado',
            style: 'destructive',
            onPress: async () => {
              const result = await adiarTrocaSenha();
              if (result.success) {
                // Marca como adiado permanentemente (até próxima política de senha)
                await AsyncStorage.setItem(STORAGE_KEY, 'true');
              } else {
                // Opcional: mostrar mensagem de falha (pode usar toast se tiver)
                console.warn('Não foi possível adiar a troca de senha no servidor');
                // Você pode mostrar outro alerta aqui se quiser
              }
            },
          },
        ],
        { cancelable: false } // força o usuário a escolher uma opção
      );
    };

    checkAndShowPasswordAlert();
  }, [precisaTrocarSenha, showAlert, router, signOut]);

  const sections: SectionItem[] = React.useMemo(
    () => [
      ...(!cadastroCompleto ? [{ type: 'banner' as const }] : []),
      { type: 'tasks' as const },
    ],
    [cadastroCompleto]
  );

  const renderItem = ({ item }: { item: SectionItem }) => {
    if (item.type === 'banner') {
      return (
        <View style={{ padding: 16 }}>
          <NotificationBanner onPress={() => router.push('/professor')} />
        </View>
      );
    }

    if (item.type === 'tasks') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Minhas Tarefas</Text>

          <View style={styles.sectionRow}>
            <View style={styles.cell}>
              <SelectButton
                onPress={() => router.push('/escolas/Escolas')}
                title="Escolas"
                iconLeft={<Backpack size={16} color={colors.primary} />}
                buttonColor={colors.greyBlur}
                textColor={colors.primary}
                borderColor={colors.primary}
                style={styles.button}
              />
            </View>

            <View style={styles.cell}>
              <SelectButton
                onPress={() => router.push('/aluno/MeusAlunos')}
                title="Meus Alunos"
                iconLeft={<Users size={16} color={colors.primary} />}
                buttonColor={colors.greyBlur}
                textColor={colors.primary}
                borderColor={colors.primary}
                style={styles.button}
              />
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.cell}>
              <SelectButton
                onPress={() => router.push('/planejamento/MeusPlanejamentos')}
                title="PDI"
                iconLeft={<NoteBlank size={16} color={colors.primary} />}
                buttonColor={colors.greyBlur}
                textColor={colors.primary}
                borderColor={colors.primary}
                style={styles.button}
              />
            </View>
            <View style={[styles.cell]}>
              <SelectButton
                onPress={() => {}}
                title=""
                iconLeft={null}
                buttonColor={colors.greyBlur}
                textColor={colors.primary}
                borderColor={colors.primary}
                style={styles.button}
              />
            </View>


          </View>
        </View>
      );
    }

    return null;
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.primary2} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/packages/ui/assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.text}>
            Plural <Text style={styles.textSecondary}>PLATAFORMA</Text>
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() =>
              showAlert('Sair da conta?', 'Isso invalidará sua sessão.', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sair',
                  onPress: async () => {
                    await signOut();
                    router.replace('/');
                  },
                },
              ])
            }
            disabled={logoutLoading}
          >
            <SignOut size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <FlatList
          data={sections}
          renderItem={renderItem}
          keyExtractor={item => item.type}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />

        <Text style={styles.footerText}>© 2025 Plural. Todos os direitos reservados.</Text>

        <CustomAlert
          visible={visible}
          title={config.title}
          message={config.message}
          buttons={config.buttons}
          onDismiss={handleDismiss}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: {
    backgroundColor: colors.primary2,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 75,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold',
    marginLeft: 10,
  },
  textSecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
    textTransform: 'uppercase',
  },
  logo: { width: 42.79, height: 33.65, marginBottom: 10 },
  sectionHeader: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cell: {
    flex: 1,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: { width: '100%', height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  footerText: {
    textAlign: 'center',
    padding: 16,
    color: colors.secondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
  },
});