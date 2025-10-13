import { colors, fontSizes } from "@/packages/ui/theme/theme";
import Header from "@src/components/Header";
import CustomButton from "@src/components/CustomButton";
import InputField from "@src/components/InputField";
import SelectButton from "@src/components/SelectButton";
import { useRouter } from "expo-router";
import { CaretRight, User } from "phosphor-react-native";
import { JSX, useEffect, useState } from "react";
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Escola } from '@src/types/escolas';
import { buscarEscolas } from '@src/services/escolasService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export default function Escolas() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const fetchEscolas = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.warn('⚠️ Nenhum token encontrado. Usuário não autenticado.');
          Alert.alert('Aviso', 'Por favor, faça login para carregar as escolas.');
          setEscolas([]);
          return;
        }

        const escolasData = await buscarEscolas();
        console.log('✅ Escolas recebidas:', escolasData);
        if (!escolasData.length) {
          Alert.alert('Aviso', 'Nenhuma escola encontrada. Verifique sua conexão ou tente novamente.');
        }
        setEscolas(escolasData);
      } catch (error: any) {
        console.error('❌ Erro ao carregar escolas:', error.message);
        Alert.alert('Erro', 'Não foi possível carregar as escolas. Tente novamente.');
        setEscolas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEscolas();
  }, []);

  const renderItems = [
    {
      id: "header",
      component: () => (
        <Header title="Escolas" onBack={() => router.back()} />
      ),
    },
    {
      id: "filter",
      component: () => (
        <InputField
          label="Filtro por escola"
          placeholder="Digite o nome da escola"
          value={filter}
          onChangeText={setFilter}
        />
      ),
    },
    {
      id: "button",
      component: () => (
        <CustomButton
          title="+ Cadastrar Escola"
          onPress={() => router.push('/escolas/EscolaScreen')}
        />
      ),
    },
    {
      id: "listEscolas",
      component: () => (
        <View>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : escolas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma escola encontrada</Text>
          ) : (
            escolas
              .filter((escola) =>
                escola.nomeInstituicao.toLowerCase().includes(filter.toLowerCase())
              )
              .map((escola) => (
                <SelectButton
                  key={escola.id}
                  onPress={() => router.push(`/escolas/EscolaScreen?id=${escola.id}`)} // Passes school ID to EscolaScreen
                  title={escola.nomeInstituicao}
                  iconLeft={<User size={16} color={colors.primary} />}
                  iconRight={<CaretRight size={16} color={colors.primary} />}
                  buttonColor={colors.greyBlur}
                  textColor={colors.primary}
                  borderColor={colors.primary}
                />
              ))
          )}
        </View>
      ),
    },
  ];

  const renderItem = ({ item }: { item: { id: string; component: () => JSX.Element } }) => (
    <View key={item.id}>{item.component()}</View>
  );

  return (
    <FlatList
      data={renderItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    padding: 20,
  },
  content: {},
  emptyText: {
    fontSize: fontSizes.f16,
    color: colors.secondary,
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'Nunito_400Regular',
  },
});