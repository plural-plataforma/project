import { colors } from '@/packages/ui/theme/theme'
import Header from '@src/components/Header'
import InputField from '@src/components/InputField'
import { buscarHabilidades } from '@src/services/habilidadeService'
import { Habilidade } from '@src/types/habilidade'
import { Planejamento } from '@src/types/planejamento'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Text, View, StyleSheet, FlatList } from 'react-native'

export default function PlanejamentoScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const planejamentoId = params.id ? Number(params.id) : null
  const isEdit = !!planejamentoId

  const [habilidades, setHabilidades] = useState<Habilidade[]>([])

  useEffect(() => {
    const fetchHabilidades = async () => {
      const data = await buscarHabilidades()
      setHabilidades(data)
    }
    fetchHabilidades()
  }, []) // Empty dependency array to run once on mount

  const formFields = useMemo(
    () => [
      {
        id: 'apelido',
        label: 'Nome do PDI',
        placeholder: '',
        value: ''
      },
      {
        id: 'etapaEnsino',
        label: 'Etapa de Ensino',
        placeholder: '',
        value: '',
        options: [
          { label: 'Educação Infantil', value: 1 },
          { label: 'Ensino Fundamental I - Anos Iniciais', value: 2 },
          { label: 'Ensino Fundamental II - Anos Finais', value: 3 },
          { label: 'Ensino Médio', value: 4 }
        ]
      },
      {
        id: 'tipoHabilidade',
        label: 'Tipo de Habilidade',
        placeholder: '',
        value: '',
        options: [
          { label: 'Cognitivo', value: 1 },
          { label: 'Socioemocional', value: 2 },
          { label: 'Comunicação', value: 3 },
          { label: 'Motora', value: 4 }
        ]
      }
    ],
    [habilidades] // Dependency on habilidades to update formFields when data changes
  )

  const flatListRef = useRef<FlatList>(null)

  const renderItem = ({ item, index }) => (
    <View
      style={[styles.inputContainer, { zIndex: formFields.length - index }]}
    >
      <InputField {...item} />
    </View>
  )

  return (
    <View style={styles.container}>
      <Header
        title={isEdit ? 'Editar PDI' : 'Cadastro de PDI'}
        onBack={() => router.back()}
        fixed={true}
      />
      <FlatList
        ref={flatListRef}
        data={formFields}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.content}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  )
}

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 70,
    flex: 1
  },
  content: {
    paddingBottom: 20
  },
  inputContainer: {
    marginBottom: 15 // Ajuste conforme o Figma
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold',
    paddingInlineStart: 10
  }
})
