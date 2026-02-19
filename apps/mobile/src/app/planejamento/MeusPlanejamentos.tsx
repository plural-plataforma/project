import { colors } from '@packages/ui/theme/theme'
import CustomButton from '@src/components/CustomButton';
import Header from '@src/components/Header';
import InputField from '@src/components/InputField';
import SelectButton from '@src/components/SelectButton';
import { buscarPlanejamento } from '@src/services/planejamentoService';
import { Planejamento } from '@src/types/planejamento';
import { useRouter } from 'expo-router';
import { BookmarkSimple, CaretRight, Eye } from 'phosphor-react-native';
import { useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native';

export default function MeusPlanejamentos() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchPlanejamentos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await buscarPlanejamento();
      setPlanejamentos(data)
    } catch (err) {
      console.error('Erro ao carregar planejamentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanejamentos();
  }, [fetchPlanejamentos]);

  useFocusEffect(
    useCallback(() => {
      fetchPlanejamentos();
    }, [fetchPlanejamentos])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlanejamentos().finally(() => setRefreshing(false));
  }, [fetchPlanejamentos]);

  const filteredPlanejamentos = planejamentos.filter(p => 
    p.apelido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPlanejamento = ({ item }: { item: Planejamento }) => (
    <SelectButton
      onPress={() => router.push({
        pathname: '/planejamento/PlanejamentoScreen',
        params: { id: item.id }
      })}
      title={item.apelido}
      iconRight={<CaretRight size={16} color={colors.primary} />}
      buttonColor={colors.greyBlur}
      textColor={colors.primary}
      borderColor={colors.primary}
    />
  );

  return (
    <View style={styles.container}>
      <Header title="PDI" onBack={() => router.back()} fixed={true} />
      <FlatList
        data={filteredPlanejamentos}
        renderItem={renderPlanejamento}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <InputField
                label="Pesquisar PDI"
                placeholder="Digite o nome do PDI..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={{ flex: 1 }}
              />
              {searchTerm && (
                <CustomButton
                  title="Limpar"
                  onPress={() => setSearchTerm('')}
                  buttonColor={{ backgroundColor: colors.primary, marginLeft: 10, alignSelf: 'center' }}
                />
              )}
            </View>
            <View style={styles.book}>
              <BookmarkSimple size={16} color={colors.primary} />
              <Text style={styles.textBook}>Meus Cadastros</Text>
            </View>
            <CustomButton
              title="+ Novo PDI"
              onPress={() => router.push('/planejamento/PlanejamentoScreen')}
            />
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum planejamento encontrado.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} /> : null
        }
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  book:{
    flexDirection:'row',
    justifyContent:'flex-start'
  },
  textBook:{
    color:colors.primary,
    fontFamily:'Nunito_400Regular',
    paddingLeft:6,
    alignItems: 'flex-start'
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.secondary,
  },
})