import { colors } from '@/packages/ui/theme/theme'
import CustomButton from '@src/components/CustomButton';
import Header from '@src/components/Header';
import InputField from '@src/components/InputField';
import SelectButton from '@src/components/SelectButton';
import { buscarPlanejamento } from '@src/services/planejamentoService';
import { Planejamento } from '@src/types/planejamento';
import { useRouter } from 'expo-router';
import { BookmarkSimple, CaretRight, Eye } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, FlatList, ActivityIndicator } from 'react-native'

export default function MeusPlanejamentos() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([])

  useEffect(() => {

    (async () => {
      try {

        const data = await buscarPlanejamento();
        console.log(data)
        setPlanejamentos(data)
      } catch (err) {
        console.error('Erro ao carregar planejamentos:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [])

  const renderPlanejamento = ({ item }: { item: Planejamento }) => (
    <SelectButton
      //key={item.id}
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
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={planejamentos}
          renderItem={renderPlanejamento}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View>
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
                <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );

}

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 70
  },
  content: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
