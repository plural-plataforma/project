import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@packages/ui/theme/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import NotificationBanner from './../../components/NotificationBanner';
import {
  Backpack,
  CheckCircle,
  LockSimple,
  NoteBlank,
  SignOut,
  UserCircle,
  Users,
} from 'phosphor-react-native';
import { Escola } from '@src/types/escolas';
import { buscarProfessor, buscarEscolasProfessor } from '@src/services/professorService';
import { isCadastroCompleto } from '@src/utils/professorUtils';
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adiarTrocaSenha } from '@src/services/auth';
import { Logo } from '@packages/ui/components';
import { buscarAlunos } from '@src/services/alunoService';
import { buscarPlanejamento } from '@src/services/planejamentoService';

type JourneyStatus = 'pending' | 'current' | 'done';

interface JourneyStep {
  id: 'escola' | 'alunos' | 'pdi';
  title: string;
  description: string;
  ctaLabel: string;
  route: '/escolas/Escolas' | '/aluno/MeusAlunos' | '/planejamento/MeusPlanejamentos';
  status: JourneyStatus;
  disabledReason?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, logoutLoading, signOut, precisaTrocarSenha } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();

  const [cadastroCompleto, setCadastroCompleto] = useState(false);
  const [professorEscolas, setProfessorEscolas] = useState<Escola[]>([]);
  const [alunosCount, setAlunosCount] = useState(0);
  const [planejamentosCount, setPlanejamentosCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [journeyFeedback, setJourneyFeedback] = useState<string | null>(null);
  const previousCountsRef = useRef<{ escolas: number; alunos: number; planejamentos: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (!isLoggedIn) {
      setShouldRedirectToLogin(true);
      return;
    }

    setLoading(true);

    try {
      const data = await buscarProfessor();

      const [escolasResult, alunosResult, planejamentosResult] = await Promise.allSettled([
        buscarEscolasProfessor(),
        buscarAlunos(),
        buscarPlanejamento(),
      ]);

      const linkedEscolas = escolasResult.status === 'fulfilled' ? escolasResult.value : [];
      const alunos = alunosResult.status === 'fulfilled' ? alunosResult.value : [];
      const planejamentos = planejamentosResult.status === 'fulfilled' ? planejamentosResult.value : [];

      if (escolasResult.status === 'rejected') {
        showAlert('Aviso', 'Não foi possível carregar as escolas vinculadas.', [{ text: 'OK' }]);
      }

      if (alunosResult.status === 'rejected' || planejamentosResult.status === 'rejected') {
        showAlert('Aviso', 'Alguns dados da jornada inicial não puderam ser carregados.', [{ text: 'OK' }]);
      }

      const professorComEscolas = {
        ...data.objeto,
        escolas: linkedEscolas.map(escola => escola.id.toString()),
      };
      setCadastroCompleto(isCadastroCompleto(professorComEscolas));
      setProfessorEscolas(linkedEscolas);
      setAlunosCount(alunos.length);
      setPlanejamentosCount(planejamentos.length);

      const currentCounts = {
        escolas: linkedEscolas.length,
        alunos: alunos.length,
        planejamentos: planejamentos.length,
      };

      if (previousCountsRef.current) {
        if (previousCountsRef.current.escolas === 0 && currentCounts.escolas > 0) {
          setJourneyFeedback('Etapa concluída: escola cadastrada. Próximo passo: cadastrar alunos.');
        } else if (previousCountsRef.current.alunos === 0 && currentCounts.alunos > 0) {
          setJourneyFeedback('Etapa concluída: aluno cadastrado. Próximo passo: criar PDI.');
        } else if (previousCountsRef.current.planejamentos === 0 && currentCounts.planejamentos > 0) {
          setJourneyFeedback('Parabéns! Você concluiu a configuração inicial da plataforma.');
        }
      }

      previousCountsRef.current = currentCounts;
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

  const hasEscolas = professorEscolas.length > 0;
  const hasAlunos = alunosCount > 0;
  const hasPlanejamentos = planejamentosCount > 0;
  const completedSteps = [hasEscolas, hasAlunos, hasPlanejamentos].filter(Boolean).length;

  const journeySteps = useMemo<JourneyStep[]>(() => {
    const escolaStatus: JourneyStatus = hasEscolas ? 'done' : 'current';
    const alunosStatus: JourneyStatus = hasAlunos ? 'done' : hasEscolas ? 'current' : 'pending';
    const pdiStatus: JourneyStatus = hasPlanejamentos ? 'done' : hasAlunos ? 'current' : 'pending';

    return [
      {
        id: 'escola',
        title: 'Cadastrar escola',
        description: 'Cadastre a primeira escola para organizar suas turmas e liberar o próximo passo.',
        ctaLabel: hasEscolas ? 'Ver escolas' : 'Cadastrar escola',
        route: '/escolas/Escolas',
        status: escolaStatus,
      },
      {
        id: 'alunos',
        title: 'Cadastrar alunos',
        description: 'Depois da escola, cadastre alunos para iniciar atendimentos e criar planos.',
        ctaLabel: hasAlunos ? 'Ver alunos' : 'Cadastrar alunos',
        route: '/aluno/MeusAlunos',
        status: alunosStatus,
        disabledReason: hasEscolas ? undefined : 'Disponível após cadastrar ao menos uma escola.',
      },
      {
        id: 'pdi',
        title: 'Criar PDI',
        description: 'Com alunos cadastrados, monte o PDI e acompanhe evolução pedagógica.',
        ctaLabel: hasPlanejamentos ? 'Ver PDIs' : 'Criar PDI',
        route: '/planejamento/MeusPlanejamentos',
        status: pdiStatus,
        disabledReason: hasAlunos ? undefined : 'Disponível após cadastrar ao menos um aluno.',
      },
    ];
  }, [hasEscolas, hasAlunos, hasPlanejamentos]);

  const nextStep = journeySteps.find(step => step.status === 'current');
  const contentWidthStyle = width >= 768 ? styles.contentWrapperDesktop : undefined;

  const renderSkeleton = () => (
    <View style={[styles.contentWrapper, contentWidthStyle]}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.primary2} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Logo width={42.79} height={33.65} styles={{ logo: { marginBottom: 10 } }} href="logo"/>
   
          <Text style={styles.text}>
            Plural <Text style={styles.textSecondary}>PLATAFORMA</Text>
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => router.push('/professor')}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
          >
            <UserCircle size={22} color={colors.primary} />
          </TouchableOpacity>

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
        {(authLoading || loading) ? (
          renderSkeleton()
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.contentWrapper, contentWidthStyle]}>
              {!cadastroCompleto && (
                <View style={styles.profileBanner}>
                  <NotificationBanner onPress={() => router.push('/professor')} />
                </View>
              )}

              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Comece por aqui</Text>
                <Text style={styles.heroSubtitle}>
                  {completedSteps}/3 etapas concluídas
                </Text>
                <Text style={styles.heroDescription}>
                  {nextStep
                    ? `Próxima ação: ${nextStep.title}.`
                    : 'Fluxo inicial concluído. Você já pode gerenciar sua rotina com mais agilidade.'}
                </Text>
              </View>

              {journeyFeedback && (
                <View style={styles.feedbackCard}>
                  <CheckCircle size={16} color={colors.success} weight="fill" />
                  <Text style={styles.feedbackText}>{journeyFeedback}</Text>
                </View>
              )}

              {!hasEscolas ? (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateTitle}>Vamos iniciar sua configuração</Text>
                  <Text style={styles.emptyStateDescription}>
                    Cadastre sua primeira escola para desbloquear o restante da jornada.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryCta}
                    onPress={() => router.push('/escolas/Escolas')}
                  >
                    <Backpack size={16} color={colors.background} />
                    <Text style={styles.primaryCtaText}>Cadastrar escola</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.stepsContainer}>
                  {journeySteps.map(step => {
                    const isCurrent = step.status === 'current';
                    const isDone = step.status === 'done';
                    const isPending = step.status === 'pending';
                    const isDisabled = isPending;

                    return (
                      <View
                        key={step.id}
                        style={[
                          styles.stepCard,
                          isCurrent && styles.stepCardCurrent,
                          isDone && styles.stepCardDone,
                        ]}
                      >
                        <View style={styles.stepHeader}>
                          <View style={styles.stepTitleWrap}>
                            {step.id === 'escola' && <Backpack size={16} color={colors.primary} />}
                            {step.id === 'alunos' && <Users size={16} color={colors.primary} />}
                            {step.id === 'pdi' && <NoteBlank size={16} color={colors.primary} />}
                            <Text style={styles.stepTitle}>{step.title}</Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              isCurrent && styles.statusBadgeCurrent,
                              isDone && styles.statusBadgeDone,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isCurrent && styles.statusBadgeTextCurrent,
                                isDone && styles.statusBadgeTextDone,
                              ]}
                            >
                              {isDone ? 'Concluído' : isCurrent ? 'Próxima ação' : 'Pendente'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.stepDescription}>{step.description}</Text>
                        {isPending && step.disabledReason ? (
                          <View style={styles.pendingInfo}>
                            <LockSimple size={14} color={colors.textMuted} />
                            <Text style={styles.pendingInfoText}>{step.disabledReason}</Text>
                          </View>
                        ) : null}

                        <TouchableOpacity
                          style={[styles.secondaryCta, isCurrent && styles.primaryCta, isDisabled && styles.disabledCta]}
                          onPress={() => {
                            if (isDisabled) return;
                            router.push(step.route);
                          }}
                          disabled={isDisabled}
                        >
                          <Text
                            style={[
                              styles.secondaryCtaText,
                              isCurrent && styles.primaryCtaText,
                              isDisabled && styles.disabledCtaText,
                            ]}
                          >
                            {step.ctaLabel}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        )}

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
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  contentWrapper: {
    width: '100%',
    padding: 16,
    alignSelf: 'center',
  },
  contentWrapperDesktop: {
    maxWidth: 760,
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
    shadowRadius: 3.84,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerAction: {
    marginRight: 12,
    padding: 4,
  },
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
  profileBanner: {
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 12,
    backgroundColor: colors.greyBlur,
    borderColor: colors.primary,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  heroTitle: {
    color: colors.primary,
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Nunito_SemiBold',
    marginBottom: 8,
  },
  heroDescription: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  feedbackCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: '#EAF8EF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedbackText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    flex: 1,
  },
  emptyStateCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  emptyStateTitle: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 6,
  },
  emptyStateDescription: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 12,
  },
  stepsContainer: {
    marginBottom: 8,
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.background,
    padding: 14,
    marginBottom: 10,
  },
  stepCardCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.greyBlur,
  },
  stepCardDone: {
    borderColor: colors.success,
    backgroundColor: '#F3FAF5',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepTitle: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  statusBadge: {
    backgroundColor: '#EFEFF0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeCurrent: {
    backgroundColor: colors.primary2,
  },
  statusBadgeDone: {
    backgroundColor: '#DFF5E4',
  },
  statusBadgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'Nunito_SemiBold',
  },
  statusBadgeTextCurrent: {
    color: colors.primary,
  },
  statusBadgeTextDone: {
    color: colors.success,
  },
  stepDescription: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 10,
    lineHeight: 20,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pendingInfoText: {
    marginLeft: 6,
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    flex: 1,
  },
  primaryCta: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryCtaText: {
    color: colors.background,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },
  secondaryCta: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Nunito_SemiBold',
  },
  disabledCta: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  disabledCtaText: {
    color: colors.textMuted,
  },
  skeletonHero: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#ECEFF1',
    marginBottom: 12,
  },
  skeletonCard: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#ECEFF1',
    marginBottom: 10,
  },
  footerText: {
    textAlign: 'center',
    padding: 16,
    color: colors.secondary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
  },
});