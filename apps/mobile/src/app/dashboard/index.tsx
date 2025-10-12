import * as React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
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
import { useEffect, useState } from 'react';
import NotificationBanner from './../../components/NotificationBanner';
import { Briefcase, FileText, SignOut, User } from 'phosphor-react-native';
import { Professor } from '@src/types/professor';
import { buscarProfessor } from '@src/services/professorService';
import { isCadastroCompleto } from '@src/utils/professorUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SelectButton from '@src/components/SelectButton';

export default function Dashboard() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, logoutLoading } = useAuth();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets(); // Obtém as dimensões da área segura, incluindo a barra de status
  const [cadastroCompleto, setCadastroCompleto] = useState(false);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await buscarProfessor();
        console.log('✅ Dados recebidos:', data);
        setProfessor(data.objeto);
        setCadastroCompleto(isCadastroCompleto(data.objeto));
      } catch (error: any) {
        console.error('❌ Erro ao carregar dados do professor:', error.message);
        if (error.message.includes('401')) {
          Alert.alert('Sessão Expirada', 'Por favor, faça login novamente.');
          await AsyncStorage.removeItem('authToken');
          router.push('/auth/login');
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os dados do professor.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (authLoading)
    return <ActivityIndicator size="large" color={colors.primary} />;

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
          <TouchableOpacity onPress={() => {
            console.log('🖱️ Botão Sair clicado!');
            Alert.alert(
              'Sair da conta?',
              'Isso invalidará sua sessão e você precisará fazer login novamente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sair',
                  onPress: () => {
                    console.log('✅ Confirmação de sair aceita!');
                    signOut();
                  },
                },
              ]
            );
          }}
            disabled={logoutLoading}>
            <SignOut size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <SafeAreaView edges={['top']}>
        <ScrollView>
          {!cadastroCompleto && <View style={{ padding: 16 }}><NotificationBanner onPress={() => router.push('/professor')} /></View>}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Minhas Tarefas</Text>
            {/* Minhas Tarefas Section */}
            <View style={styles.container}>
              <View style={styles.sectionRow}>
                <View style={styles.cell}>
                  <SelectButton key="btnEscolas" onPress={() => router.push('/escolas/Escolas')} title="Escolas"
                    iconLeft={<User size={16} color={colors.primary} />}
                    buttonColor={colors.greyBlur} textColor={colors.primary} borderColor={colors.primary}
                  />
                </View>
                <View style={styles.cell}>
                  <SelectButton key="btnMeusAlunos" onPress={() => router.push('/aluno/MeusAlunos')} title="Meus Alunos"
                    iconLeft={<User size={16} color={colors.primary} />}
                    buttonColor={colors.greyBlur} textColor={colors.primary} borderColor={colors.primary}
                  />
                </View>
              </View>
             {/**  <View style={styles.sectionRow}>
                <View style={styles.cell}>
                  <Text style={styles.cellText}>3</Text>
                </View>
                <View style={styles.cell}>
                  <SelectButton key="btnMeusAlunos" onPress={() => router.push('/aluno/MeusAlunos')} title="Meus Alunos"
                    iconLeft={<User size={16} color={colors.primary} />}
                    buttonColor={colors.greyBlur} textColor={colors.primary} borderColor={colors.primary}
                  />
                </View>
               
              </View> */}
            </View>
          </View>
        </ScrollView>

        <Text style={{ textAlign: 'center', padding: 16, color: colors.secondary, fontFamily: 'Nunito_400Regular' }}>© 2024 Plural. Todos os direitos reservados.</Text>
      </SafeAreaView>
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    marginBottom: 10
  },
  sectionHeader: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background
  },
  section: {
    marginBottom: 16,
    flex: 1,
    flexDirection: 'row',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },

  row: {

  },
  cell: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 16,
    color: colors.primary,
  },
});