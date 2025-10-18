import { colors } from '@/packages/ui/theme/theme'
import Header from '@src/components/Header'
import InputField from '@src/components/InputField'
import { Planejamento } from '@src/types/planejamento'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Text, View, StyleSheet, FlatList } from 'react-native'


export default function PlanejamentoScreen() {
  const router = useRouter()
  const params = useLocalSearchParams();
  const planejamentoId = params.id ? Number(params.id) : null;
  const isEdit = !!planejamentoId;

  const formFields = useMemo(() =>[
    {
      id: 'apelido',
      label: "Nome do PDI",
      placeholder: "",
      value:  '',
    },
    {
      id: 'etapaEnsino',
      label: "Etapa de Ensino",
      placeholder: "",
      value:  '',
    },
    {
      id: 'tipoHabilidade',
      label: "Tipo de Habilidade",
      placeholder: "",
      value:  '', 
    }
  ], []);

  
  
  return (

    <View style={styles.container}>
      <Header title={isEdit ? "Editar PDI" : "Cadastro de PDI"} onBack={() => router.back()} fixed={true} />
      <FlatList data={formFields}
        renderItem={({ item, index }) => (
          <View style={[{marginBottom: 15}, { zIndex: formFields.length - index }]}>
            <InputField {...item} />
            
          </View>
        )}
         keyExtractor={(item) => item.id.toString()}
      />
    </View>
  )
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
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold',
    paddingInlineStart: 10,
  },
})  
