import { colors } from '@packages/ui/theme/theme';
import CustomButton from '@src/components/CustomButton';
import Header from '@src/components/Header';
import InputField from '@src/components/InputField';
import SelectButton from '@src/components/SelectButton';
import { buscarAvaliacoesDiagnosticas } from '../../services/avaliacaoDiagnosticaService';
import { AvaliacaoDiagnosticaResumo } from '../../types/avaliacao-diagnostica'; // Type que sugeri antes
import { useRouter } from 'expo-router';
import { BookmarkSimple, CaretRight, Plus } from 'phosphor-react-native';
import { useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function MinhasAvaliacoesDiagnosticas() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDiagnosticaResumo[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchAvaliacoes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await buscarAvaliacoesDiagnosticas(); // Seu endpoint/service
      setAvaliacoes(data);
    } catch (err) {
      console.error('Erro ao carregar avaliações diagnósticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvaliacoes();
  }, [fetchAvaliacoes]);

  useFocusEffect(
    useCallback(() => {
      fetchAvaliacoes();
    }, [fetchAvaliacoes])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAvaliacoes().finally(() => setRefreshing(false));
  }, [fetchAvaliacoes]);

  const filteredAvaliacoes = avaliacoes.filter(a =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderAvaliacao = ({ item }: { item: AvaliacaoDiagnosticaResumo }) => (
    <SelectButton
      onPress={() => router.push({
        pathname: '/avaliacaoDiagnostica/AvaliacaoScreen', // Crie essa tela para detalhes/registro
        params: { id: item.id }
      })}
      title={item.titulo}
     // subtitle={`Alunos: ${item.quantidadeAlunos} • Blocos: ${item.quantidadeBlocos} • ${item.concluida ? 'Concluída' : 'Em andamento'}`}
      iconRight={<CaretRight size={16} color={colors.primary} />}
      buttonColor={colors.greyBlur}
      textColor={colors.primary}
      borderColor={colors.primary}
    />
  );

  return (
    <View style={styles.container}>
      <Header title="Avaliação Diagnóstica" onBack={() => router.back()} fixed={true} />

      <FlatList
        data={filteredAvaliacoes}
        renderItem={renderAvaliacao}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        
        ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <InputField
                label="Procurar Avaliação"
                placeholder="Nome da Avaliação"
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
              <Text style={styles.textBook}>Minhas Avaliações</Text>
            </View>

            <CustomButton
              title="+ Criar Avaliação"
              onPress={() => router.push('/avaliacaoDiagnostica/criacao/step1-identificacao')} // Tela de criação
             
            />
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma avaliação diagnóstica encontrada.</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop:90,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  book: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    //alignItems: 'center',
   // marginVertical: 10,
  },
  textBook: {
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
    paddingLeft: 6,
    alignItems: 'flex-start'
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
});