import { colors } from '@/packages/ui/theme/theme'
import Header from '@src/components/Header'
import InputField from '@src/components/InputField'
import { buscarHabilidades } from '@src/services/habilidadeService'
import { buscarAlunos } from '@src/services/alunoService' // Assumindo serviço para buscar alunos
import { buscarPlanejamentoPorId, atualizarPlanejamento, vincularAluno, vincularHabilidade } from '@src/services/planejamentoService'
import { Habilidade } from '@src/types/habilidade'
import { Aluno } from '@src/types/aluno'
import { Planejamento } from '@src/types/planejamento'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Text, View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Button, ActivityIndicator } from 'react-native'
import { Alert } from 'react-native' // Assumindo que Alert é usado para feedback
import { CheckSquare, Square } from 'phosphor-react-native'; // Ícones do Phosphor
import { CustomAlert, useCustomAlert } from '@src/hooks/useCustomAlert'
import CustomButton from '@src/components/CustomButton'

export default function PlanejamentoScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();
  const planejamentoId = params.id ? Number(params.id) : null
  const isEdit = !!planejamentoId

  const [habilidades, setHabilidades] = useState<Habilidade[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [filteredHabilidades, setFilteredHabilidades] = useState<Habilidade[]>([])
  const [filteredAlunos, setFilteredAlunos] = useState<Aluno[]>([])
  const [selectedHabilidades, setSelectedHabilidades] = useState<Habilidade[]>([])
  const [selectedAlunos, setSelectedAlunos] = useState<Aluno[]>([])
  const [formData, setFormData] = useState({
    apelido: '',
    etapaEnsino: '',
    tipoHabilidade: '',
    dataInicio: '',
    dataFim: ''
  })
  const [loading, setLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    const fetchHabilidades = async () => {
      const data = await buscarHabilidades()
      setHabilidades(data)
    }
    fetchHabilidades()
  }, [])

  useEffect(() => {
    const fetchAlunos = async () => {
      const data = await buscarAlunos()
      setAlunos(data)
    }
    fetchAlunos()
  }, [])

  useEffect(() => {
    if (!isEdit) {
      // Define data de início como data atual para novos PDIs
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({
        ...prev,
        dataInicio: today,
        dataFim: today // Ou deixar vazio para o usuário definir
      }))
    }
  }, [isEdit])

  useEffect(() => {
    if (isEdit && planejamentoId) {
      fetchPlanejamentoData()
    }
  }, [planejamentoId])

  const fetchPlanejamentoData = async () => {
    if (!planejamentoId) return
    setIsLoadingData(true)
    try {
      const planejamento = await buscarPlanejamentoPorId(planejamentoId)
      // Assumindo que o retorno inclui apelido, dataInicio, dataFim, e uma lista de habilidades e alunos vinculados
      setFormData(prev => ({
        ...prev,
        apelido: planejamento.apelido || '',
        dataInicio: planejamento.dataInicio || '',
        dataFim: planejamento.dataFim || ''
      }))
      // Assumindo que planejamento.habilidades é um array de Habilidade vinculadas
      setSelectedHabilidades(planejamento.habilidades || [])
      // Assumindo que planejamento.aluno é um array de Aluno vinculados
      setSelectedAlunos(planejamento.aluno?.filter(a => a.id !== undefined) || [])
    } catch (error) {
      showAlert('Erro', 'Falha ao carregar dados do PDI.')
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    const etapaFilter = formData.etapaEnsino ? Number(formData.etapaEnsino) : null
    const tipoFilter = formData.tipoHabilidade ? formData.tipoHabilidade : null

    const filtered = habilidades.filter(habilidade =>
      (!etapaFilter || habilidade.idNivelEnsino === etapaFilter) &&
      (!tipoFilter || habilidade.tipo === tipoFilter)
    )
    setFilteredHabilidades(filtered)
  }, [habilidades, formData.etapaEnsino, formData.tipoHabilidade])

  // Filtro para alunos, se necessário (ex: por nome ou etapa)
  // Por simplicidade, sem filtro por agora; todos os alunos disponíveis
  useEffect(() => {
    setFilteredAlunos(alunos.filter(a => a.id !== undefined))
  }, [alunos])

  const formFields = useMemo(
    () => [
      {
        id: 'apelido',
        label: 'Nome do PDI',
        placeholder: '',
        value: formData.apelido
      },
      {
        id: 'etapaEnsino',
        label: 'Etapa de Ensino',
        placeholder: '',
        value: formData.etapaEnsino,
        options: [
          { label: 'Educação Infantil', value: '1' },
          { label: 'Ensino Fundamental I - Anos Iniciais', value: '2' },
          { label: 'Ensino Fundamental II - Anos Finais', value: '3' },
          { label: 'Ensino Médio', value: '4' }
        ]
      },
      {
        id: 'tipoHabilidade',
        label: 'Tipo de Habilidade',
        placeholder: '',
        value: formData.tipoHabilidade,
        options: [
          { label: 'Cognitivo', value: '1' },
          { label: 'Socioemocional', value: '2' },
          { label: 'Comunicação', value: '3' },
          { label: 'Motora', value: '4' }
        ]
      },
      {
        id: 'dataInicio',
        label: 'Data Início',
        placeholder: 'YYYY-MM-DD',
        value: formData.dataInicio,
        keyboardType: 'default' // Melhor para datas, ou implementar date picker
      },
      {
        id: 'dataFim',
        label: 'Data Fim',
        placeholder: 'YYYY-MM-DD',
        value: formData.dataFim,
        keyboardType: 'default'
      }
    ],
    [formData] // Dependência em formData para atualizar valores
  )

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const toggleSelectionHabilidade = (habilidade: Habilidade) => {
    if (selectedHabilidades.some(s => s.id === habilidade.id)) {
      setSelectedHabilidades(prev => prev.filter(s => s.id !== habilidade.id))
      showAlert('Removido', `${habilidade.descricao} removida do PDI.`)
    } else {
      setSelectedHabilidades(prev => [...prev, habilidade])
      showAlert('Adicionado', `${habilidade.descricao} adicionada ao PDI.`)
    }
  }

  const toggleSelectionAluno = (aluno: Aluno) => {
    if (!aluno.id) return; // Evita seleção se sem ID
    if (selectedAlunos.some(s => s.id === aluno.id)) {
      setSelectedAlunos(prev => prev.filter(s => s.id !== aluno.id))
      showAlert('Removido', `${aluno.nomeCompleto} removido do PDI.`) // Assumindo que Aluno tem 'nome'
    } else {
      setSelectedAlunos(prev => [...prev, aluno])
      showAlert('Adicionado', `${aluno.nomeCompleto} adicionado ao PDI.`)
    }
  }

  const handleSave = async () => {
    if (!formData.apelido.trim()) {
      showAlert('Erro', 'O nome do PDI é obrigatório.')
      return
    }
    if (selectedAlunos.length === 0) {
      showAlert('Erro', 'Pelo menos um aluno deve ser selecionado.')
      return
    }
    if (!formData.dataInicio) {
      showAlert('Erro', 'Data de início é obrigatória.')
      return
    }
    if (formData.dataFim && new Date(formData.dataFim) < new Date(formData.dataInicio)) {
      showAlert('Erro', 'Data de fim deve ser posterior à data de início.')
      return
    }
    setLoading(true)
    try {
      let planejamentoIdFinal: number
      const updatePayload = {
        id: planejamentoId || 0,
        apelido: formData.apelido,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim || '' // Permite vazio se não definido
      }

      if (isEdit) {
        // Atualiza o planejamento
        const updated = await atualizarPlanejamento(updatePayload)
        planejamentoIdFinal = updated.id
      } else {
        // Assumindo que atualizar pode ser usado para criar se id=0
        // Se houver endpoint separado para criação, substituir aqui
        const created = await atualizarPlanejamento(updatePayload)
        planejamentoIdFinal = created.id
      }

      // Nota: Para sincronizar completamente, seria ideal remover vínculos antigos não selecionados.
      // Como não há endpoint de desvincular, apenas adicionamos os selecionados (pode duplicar se já existirem).
      // Em produção, implementar diff e desvincular se necessário.

      // Vincula os alunos selecionados
      for (const aluno of selectedAlunos) {
        if (aluno.id) {
          await vincularAluno({
            idPlanejamento: planejamentoIdFinal,
            idAluno: aluno.id
          })
        }
      }

      // Vincula as habilidades selecionadas
      for (const hab of selectedHabilidades) {
        if (hab.id) {
          await vincularHabilidade({
            idPlanejamento: planejamentoIdFinal,
            idHabilidade: hab.id
          })
        }
      }

      showAlert('Sucesso', `PDI ${isEdit ? 'atualizado' : 'criado'} com sucesso!`)
      router.back()
    } catch (error) {
      showAlert('Erro', 'Falha ao salvar PDI.')
    } finally {
      setLoading(false)
    }
  }

  const renderFormItem = (field: any, index: number) => (
    <View
      key={field.id}
      style={[styles.inputContainer, { zIndex: formFields.length - index }]}
    >
      <InputField
        {...field}
        onChangeText={field.options ? undefined : (text: string) => handleInputChange(field.id, text)}
        onValueChange={field.options ? (value: string) => handleInputChange(field.id, value) : undefined}
      />
    </View>
  )

  const renderHabilidadeItem = ({ item }: { item: Habilidade }) => {
    const isSelected = selectedHabilidades.some(s => s.id === item.id)
    return (
      <TouchableOpacity
        style={[
          styles.botaoHabilidade,
          isSelected && styles.botaoSelecionado
        ]}
        onPress={() => toggleSelectionHabilidade(item)}
      >
        <Text style={styles.descricaoHabilidade}>{item.descricao}</Text>
        {isSelected ? (
          <CheckSquare size={24} color={colors.primary} weight="fill" />
        ) : (
          <Square size={24} color={colors.primary} weight="regular" />
        )}
      </TouchableOpacity>
    )
  }

  const renderAlunoItem = ({ item }: { item: Aluno }) => {
    const isSelected = selectedAlunos.some(s => s.id === item.id)
    return (
      <TouchableOpacity
        style={[
          styles.botaoHabilidade,
          isSelected && styles.botaoSelecionado
        ]}
        onPress={() => toggleSelectionAluno(item)}
      >
        <Text style={styles.descricaoHabilidade}>{item.nomeCompleto}</Text> {/* Assumindo 'nome' no Aluno */}
        {isSelected ? (
          <CheckSquare size={24} color={colors.primary} weight="fill" />
        ) : (
          <Square size={24} color={colors.primary} weight="regular" />
        )}
      </TouchableOpacity>
    )
  }

  const keyExtractorAluno = (item: Aluno, index: number) => {
    return item.id ? item.id.toString() : index.toString()
  }

  if (isLoadingData) {
    return (
      <View style={styles.container}>
        <Header
          title={isEdit ? 'Editar PDI' : 'Cadastro de PDI'}
          onBack={() => router.back()}
          fixed={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header
        title={isEdit ? 'Editar PDI' : 'Cadastro de PDI'}
        onBack={() => router.back()}
        fixed={true}
      />
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {formFields.map((field, index) => renderFormItem(field, index))}

        <View style={styles.habilidadesSection}>
          <Text style={styles.tituloHabilidades}>Habilidades Disponíveis</Text>
          <FlatList
            data={filteredHabilidades}
            renderItem={renderHabilidadeItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.listaHabilidades}
            scrollEnabled={false}
          />
          {selectedHabilidades.length > 0 && (
            <View style={styles.resumoPdi}>
              <Text style={styles.resumoTexto}>
                Habilidades: {selectedHabilidades.length} selecionadas
              </Text>
            </View>
          )}
        </View>

        <View style={styles.alunosSection}>
          <Text style={styles.tituloHabilidades}>Alunos Disponíveis</Text>
          <FlatList
            data={filteredAlunos}
            renderItem={renderAlunoItem}
            keyExtractor={keyExtractorAluno}
            style={styles.listaHabilidades}
            scrollEnabled={false}
          />
          {selectedAlunos.length > 0 && (
            <View style={styles.resumoPdi}>
              <Text style={styles.resumoTexto}>
                Alunos: {selectedAlunos.length} selecionados
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.saveButtonContainer}>
        <CustomButton
          title={isEdit ? 'Atualizar PDI' : 'Criar PDI'}
          buttonColor={{ backgroundColor: colors.primary2 }}
          onPress={handleSave}
          disabled={loading}

        />
      </View>
      <CustomAlert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={handleDismiss}
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
  scrollContainer: {
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
  },
  habilidadesSection: {
    marginTop: 20
  },
  alunosSection: {
    marginTop: 20
  },
  tituloHabilidades: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center'
  },
  listaHabilidades: {
    flexGrow: 0
  },
  botaoHabilidade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary || '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  botaoSelecionado: {
    backgroundColor: '#e3f2fd',
    borderColor: colors.primary,
    borderWidth: 3
  },
  descricaoHabilidade: {
    flex: 1,
    fontSize: 16,
    color: colors.primary,
    fontFamily: 'Nunito_400Regular'
  },
  resumoPdi: {
    padding: 16,
    backgroundColor: colors.greyBlur,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center'
  },
  resumoTexto: {
    fontWeight: '600',
    color: colors.primary,
    fontFamily: 'Nunito_400Regular'
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
})