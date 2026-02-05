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
import { colors } from '@/packages/ui/theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomButton from '../../components/CustomButton';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import NotificationBanner from './../../components/NotificationBanner';
import { Backpack, NoteBlank, SignOut, Users } from 'phosphor-react-native';
import { Professor } from '@src/types/professor';
import { Escola } from '@src/types/escolas'; // NOVO: Import Escola para tipagem
import { buscarProfessor, buscarEscolasProfessor } from '@src/services/professorService';
import { isCadastroCompleto } from '@src/utils/professorUtils';
import SelectButton from '@src/components/SelectButton';
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';
import { useFocusEffect } from '@react-navigation/native'; // NOVO: Import para re-fetch no focus
import AsyncStorage from '@react-native-async-storage/async-storage';


interface SectionItem {
  type: 'banner' | 'tasks';
}

export default function Dashboard() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, logoutLoading, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [cadastroCompleto, setCadastroCompleto] = useState(false);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [professorEscolas, setProfessorEscolas] = useState<Escola[]>([]); // NOVO: Estado separado para escolas completas (evita conflito de tipo)
  const [loading, setLoading] = useState<boolean>(true);
  const [dataFetched, setDataFetched] = useState(false); // Flag para evitar re-runs
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();
  const { precisaTrocarSenha } = useAuth();
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);

  // NOVO: Função para fetch dados (reutilizável para useEffect e useFocusEffect)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (!isLoggedIn) {
        console.warn('⚠️ Usuário não está logado. Redirecionando para login...');
        setShouldRedirectToLogin(true);
        return;
      }

      const data = await buscarProfessor();

      let updatedProfessor: Professor = {
        ...data.objeto,
        escolas: [], // Mantém como string[] para compatibilidade com tipo Professor
      };

      try {
        const linkedEscolas = await buscarEscolasProfessor();
        // FIX: Armazena IDs no professor.escolas (para save/diff) e objetos completos em professorEscolas (para info/display)
        updatedProfessor.escolas = linkedEscolas.map(escola => escola.id!.toString());
        setProfessorEscolas(linkedEscolas); // NOVO: Estado separado com info completa das escolas
      } catch (error: any) {
        console.error('❌ Erro em buscarEscolasProfessor:', error.message);
        showAlert('Aviso', 'Não foi possível carregar as escolas vinculadas.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'OK', onPress: () => ({}) }
        ])
        setProfessorEscolas([]); // NOVO: Vazio se erro
      }

      setProfessor(updatedProfessor);
      // FIX: Garante que cadastroCompleto seja setado corretamente após fetch dos dados do professor
      const isComplete = isCadastroCompleto(updatedProfessor);
      setCadastroCompleto(isComplete);

    } catch (error: any) {
      console.error('❌ Erro geral em fetchData:', error.message, error);
      if (error.message.includes('401') || error.message.includes('Nenhum token')) {

        showAlert('Sessão Expirada', 'Por favor, faça login novamente.', [
          {
            text: 'OK',
            onPress: async () => {
              await signOut();
              router.replace('/auth/login');
            }
          }
        ]);

      } else {
        showAlert('Erro', 'Não foi possível carregar os dados do professor.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, router, showAlert, signOut]); // Dependências corretas

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace('/auth/login');
    }
  }, [shouldRedirectToLogin, router]);

  // Mantenha o useFocusEffect para recarregar quando voltar à tela
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        fetchData();
      }
    }, [fetchData, isLoggedIn])
  );

  const sections: SectionItem[] = React.useMemo(() => {
    return [
      // FIX: Condicional restaurado para apresentar o NotificationBanner apenas se cadastro incompleto (isCadastroCompleto false)
      ...(!cadastroCompleto ? [{ type: 'banner' as const }] : []),
      { type: 'tasks' as const },
    ];
  }, [cadastroCompleto]);

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
                key="btnEscolas"
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
                key="btnMeusAlunos"
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
                key="btnPdi"
                onPress={() => router.push('/planejamento/MeusPlanejamentos')}
                title="PDI"
                iconLeft={<NoteBlank size={16} color={colors.primary} />}
                buttonColor={colors.greyBlur}
                textColor={colors.primary}
                borderColor={colors.primary}
                style={styles.button}
              />
            </View>
            <View style={[styles.cell, { borderWidth: 0 }]}>
              <SelectButton
                key="btnPdi"
                onPress={() => ({})}
                title=""
                iconLeft={""}
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

  const keyExtractor = (item: SectionItem) => item.type;

  useEffect(() => {
    const checkPasswordAlert = async () => {
      const alertaTrocouSenhaMostrado = await AsyncStorage.getItem('alertTrocaSenhaDashboardMostrado');

      if (precisaTrocarSenha && !alertaTrocouSenhaMostrado) {
        showAlert(
          'Troca de Senha Requerida',
          'Por motivos de segurança, é necessário alterar sua senha antes de continuar. Caso deseja alterar depois acesse Perfil > Preferências',
          [
            {
              text: 'Trocar agora',
              onPress: () => router.replace('/auth/changePassword'),
            },
            {
              text: 'Não quero',
              style: 'destructive',
              onPress: async () => {
                await AsyncStorage.setItem('alertTrocaSenhaDashboardMostrado', 'true');
              },
            },
          ]
        );
      }
    };
    checkPasswordAlert();
  }, [precisaTrocarSenha]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchData();
  }, [authLoading, fetchData]); // NOVO: Dependências simplificadas, sem dataFetched para permitir re-run se authLoading mudar

  // NOVO: Re-fetch no focus da tela (ex.: após completar cadastro e voltar)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (authLoading || loading) return <ActivityIndicator size="large" color={colors.primary} />;
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
            onPress={() => {
              showAlert(
                'Sair da conta?',
                'Isso invalidará sua sessão e você precisará fazer login novamente.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sair',
                    onPress: async () => {
                      await signOut();
                      router.replace('/')
                    },
                  },
                ]
              );
            }}
            disabled={logoutLoading}
          >
            <SignOut size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <SafeAreaView edges={['top']}>
        <FlatList
          data={sections}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ right: 1 }}
        />
        <Text
          style={{
            textAlign: 'center',
            padding: 16,
            color: colors.secondary,
            fontFamily: 'Nunito_400Regular',
          }}
        >
          © 2025 Plural. Todos os direitos reservados.
        </Text>
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

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: colors.primary2,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 75,
    elevation: 2,
    boxShadow: ' 0px 2px rgba(0, 0, 0, 0.25)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold',
    paddingInlineStart: 10,
  },
  textSecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
    textTransform: 'uppercase',
  },
  logo: {
    width: 42.79,
    height: 33.65,
    marginBottom: 10,
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: colors.background,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  cell: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'stretch',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
  },
  button: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center'
  },
});