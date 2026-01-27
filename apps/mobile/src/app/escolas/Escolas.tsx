import { colors, fontSizes } from "@packages/ui/theme/theme";
import Header from "@src/components/Header";
import CustomButton from "@src/components/CustomButton";
import InputField from "@src/components/InputField";
import SelectButton from "@src/components/SelectButton";
import { useRouter } from "expo-router";
// NOVO: Importe useFocusEffect do React Navigation
import { useFocusEffect } from '@react-navigation/native';
import { CaretRight, User } from "phosphor-react-native";
import { JSX, useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  FlatList,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  RefreshControl,
  Platform, // Adicionado para detectar web
} from "react-native";
import { Escola } from '@src/types/escolas';
import { buscarEscolas } from '@src/services/escolasService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';


export default function Escolas() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<any>(null);
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();

  const isWeb = Platform.OS === 'web'; // Detecta se é web

  const fetchEscolas = useCallback(async (msg = true) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ Nenhum token encontrado. Usuário não autenticado.');
        if (msg) {
          showAlert('Aviso', 'Por favor, faça login para carregar as escolas.',);
        }
        setEscolas([]);
        return;
      }

      const escolasData = await buscarEscolas();

      setEscolas(escolasData);
      // NOVO: Removi o showAlert aqui para evitar alertas desnecessários no refresh silencioso
      // Se quiser alertar só quando não há escolas, mantenha condicional:
      if (!escolasData.length && msg) { // Adicionei 'msg' na condição
        showAlert('Aviso', 'Nenhuma escola encontrada. Verifique sua conexão ou tente novamente.');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar escolas:', error.message);
      setError(error.message || 'Erro desconhecido');
      if (showAlert && msg) { // Adicionei 'msg' para silenciar no refresh
        showAlert('Erro', 'Não foi possível carregar as escolas. Tente novamente.');
      }
      setEscolas([]);
    } finally {
      setLoading(false);
    }
  }, [showAlert]); // Adicionei showAlert nas dependências, se necessário

  useEffect(() => {
    fetchEscolas();
  }, [fetchEscolas]);

  // NOVO: Hook para refresh automático ao ganhar foco (ex.: voltar da EscolaScreen)
  useFocusEffect(
    useCallback(() => {
      // Chama fetchEscolas silenciosamente (msg=false) para evitar alertas
      fetchEscolas(false);
    }, [fetchEscolas])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEscolas(false).finally(() => setRefreshing(false));
  }, [fetchEscolas]);

  const filteredEscolas = useMemo(() => {
    if (!filter.trim()) return escolas;
    return escolas.filter((escola) =>
      escola.nomeInstituicao.toLowerCase().includes(filter.toLowerCase())
    );
  }, [escolas, filter]);

  const renderEscolaItem = useCallback(({ item: escola }: { item: Escola }) => (
    <SelectButton
      onPress={() => router.push(`/escolas/EscolaScreen?id=${escola.id}`)}
      title={escola.nomeInstituicao}
      iconLeft={<User size={16} color={colors.primary} />}
      iconRight={<CaretRight size={16} color={colors.primary} />}
      buttonColor={colors.greyBlur}
      textColor={colors.primary}
      borderColor={colors.primary}
    />
  ), [router]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return null;
    }
    const message = filter ? 'Nenhuma escola encontrada com esse filtro.' : 'Nenhuma escola encontrada.';
    return (
      <Text style={styles.emptyText}>{message}</Text>
    );
  }, [filter, loading]);

  const handleDismissKeyboard = () => {
    if (!isWeb) { // Evita no web, onde Keyboard.dismiss pode interferir
      Keyboard.dismiss();
    }
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro: {error}</Text>
        <CustomButton title="Tentar Novamente" onPress={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Escolas" onBack={() => router.back()} fixed={true} />
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.innerContainer}>
          {/* Header sempre visível, sem wrapper problemático */}
          <View style={styles.headerContent}>
            <InputField
              ref={inputRef}
              label="Filtro por escola"
              placeholder="Digite o nome da escola"
              value={filter}
              onChangeText={(text) => {
                setFilter(text);
              }}
              editable={true}
              selectTextOnFocus={true} // Ajuda com foco no web
              style={{ marginBottom: 15 }}
              onFocus={() => {
                if (isWeb && inputRef.current) {
                  inputRef.current.focus(); // Força foco no web
                }
              }}
              onBlur={() => ({})}
            />
            <CustomButton
              title="+ Cadastrar Escola"
              onPress={() => router.push('/escolas/EscolaScreen')}
            />
          </View>

          {/* Wrapper condicional: Sem Touchable no web */}
          {isWeb ? (
            <FlatList
              data={filteredEscolas}
              renderItem={renderEscolaItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={renderEmpty}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always" // Mais permissivo no web
              removeClippedSubviews={false}
            />
          ) : (
            <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
              <FlatList
                data={filteredEscolas}
                renderItem={renderEscolaItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={false}
              />
            </TouchableWithoutFeedback>
          )}
        </View>
      )}
      <CustomAlert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 70
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContent: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyText: {
    fontSize: fontSizes.f16,
    color: colors.secondary,
    textAlign: 'center',
    marginVertical: 40,
    fontFamily: 'Nunito_400Regular',
  },
  errorText: {
    fontSize: fontSizes.f16,
    color: colors.danger || '#ff0000',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Nunito_400Regular',
  },
});