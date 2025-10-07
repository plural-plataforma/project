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
import { SignOut } from 'phosphor-react-native';
import { Professor } from '@src/types/professor';
import { buscarProfessor } from '@src/services/professorService';
import { isCadastroCompleto } from '@src/utils/professorUtils';

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
        setProfessor(data.objeto);
        setCadastroCompleto(isCadastroCompleto(data.objeto));
        //setCadastroCompleto(true);
      } catch (error) {
        console.error('Erro ao carregar dados do professor:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do professor.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  
  useEffect(() => {
     //setCadastroCompleto(true);
    console.log(
      `🔍 useEffect: authLoading=${authLoading}, isLoggedIn=${isLoggedIn}`
    );
   
    if (!authLoading && !isLoggedIn) {
      console.log('🚀 useEffect detectou !isLoggedIn, redirecionando...');
    }
  }, [isLoggedIn, authLoading]);

  if (authLoading)
    return <ActivityIndicator size="large" color={colors.primary} />;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.tertiary} />
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
            <SignOut size={32} />
          </TouchableOpacity>
        </View>
      </View>
      <SafeAreaView edges={['top']}>
        <ScrollView>
          { !cadastroCompleto && <NotificationBanner onPress={() => router.push('/professor')}/>}

        </ScrollView>
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
    backgroundColor: colors.tertiary,
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
    paddingInlineStart:10,
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
});