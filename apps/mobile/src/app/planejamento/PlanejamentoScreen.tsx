import { colors } from '@/packages/ui/theme/theme'
import Header from '@src/components/Header'
import InputField from '@src/components/InputField'
import { buscarHabilidades } from '@src/services/habilidadeService'
import { buscarAlunos } from '@src/services/alunoService' // Assumindo serviço para buscar alunos
import { buscarPlanejamentoPorId, atualizarPlanejamento, cadastrarPlanejamento, buscarPlanejamento, vincularAluno, vincularHabilidade } from '@src/services/planejamentoService'
import { Habilidade } from '@src/types/habilidade'
import { Aluno } from '@src/types/aluno'
import { Planejamento } from '@src/types/planejamento'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Text, View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Button, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { Alert } from 'react-native' // Assumindo que Alert é usado para feedback
import { CheckSquare, Square } from 'phosphor-react-native'; // Ícones do Phosphor
import { CustomAlert, useCustomAlert } from '@src/hooks/useCustomAlert'
import CustomButton from '@src/components/CustomButton'
import dayjs from 'dayjs'
import DatePicker, { DateType } from 'react-native-ui-datepicker'

interface FormField {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options?: { label: string; value: string; }[];
}

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
  const [originalSelectedHabilidades, setOriginalSelectedHabilidades] = useState<Habilidade[]>([])
  const [originalSelectedAlunos, setOriginalSelectedAlunos] = useState<Aluno[]>([])
  const [formData, setFormData] = useState({
    apelido: '',
    etapaEnsino: '',
    tipoHabilidade: '',
    dataInicio: '',
    dataFim: ''
  })
  const [dateRange, setDateRange] = useState({
    startDate: dayjs(), // Data de início inicial (hoje)
    endDate: null as dayjs.Dayjs | null, // Data de fim inicial (null)
  })
  const [loading, setLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [searchHabilidades, setSearchHabilidades] = useState('')
  const [searchAlunos, setSearchAlunos] = useState('')

  // Estilos customizados para o DatePicker (para cor de item selecionado)
  const datePickerStyles: { [key: string]: ViewStyle | TextStyle } = {
    selected: {
      backgroundColor: colors.primary,
    },
    selected_label: {
      color: '#fff', // Cor do texto no item selecionado (branco para contraste)
    },
    inRange: {
      backgroundColor: `${colors.primary}20`, // Cor semi-transparente para o range (20% opacidade)
    },
    rangeStart: {
      backgroundColor: colors.primary,
    },
    rangeEnd: {
      backgroundColor: colors.primary,
    },
    rangeStart_label: {
      color: '#fff',
    },
    rangeEnd_label: {
      color: '#fff',
    },
  }

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
      const today = dayjs()
      setDateRange({
        startDate: today,
        endDate: null
      })
      setFormData(prev => ({
        ...prev,
        dataInicio: today.format('YYYY-MM-DD'),
        dataFim: '' // Deixa vazio inicialmente
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
      const startDateStr = planejamento.dataInicio || ''
      const endDateStr = planejamento.dataFim || ''
      setFormData(prev => ({
        ...prev,
        apelido: planejamento.apelido || '',
        dataInicio: startDateStr,
        dataFim: endDateStr
      }))

      // Converte strings para dayjs para o picker
      const startDate = startDateStr ? dayjs(startDateStr) : dayjs()
      const endDate = endDateStr ? dayjs(endDateStr) : null
      setDateRange({
        startDate,
        endDate
      })

      // Assumindo que planejamento.habilidades é um array de Habilidade vinculadas
      const habilidadesVinculadas = planejamento.habilidades || []
      setSelectedHabilidades(habilidadesVinculadas)
      setOriginalSelectedHabilidades(habilidadesVinculadas)
      // Assumindo que planejamento.alunos é um array de Aluno vinculados
      const alunosVinculados = planejamento.alunos?.filter(a => a.id !== undefined) || []
      setSelectedAlunos(alunosVinculados)
      setOriginalSelectedAlunos(alunosVinculados)
    } catch (error) {
      showAlert('Erro', 'Falha ao carregar dados do PDI.')
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isEdit) return;

    const etapaFilter = formData.etapaEnsino ? Number(formData.etapaEnsino) : null
    const tipoFilter = formData.tipoHabilidade ? formData.tipoHabilidade : null

    const filtered = habilidades.filter(habilidade =>
      (!etapaFilter || habilidade.idNivelEnsino === etapaFilter) &&
      (!tipoFilter || habilidade.tipo === tipoFilter) &&
      (searchHabilidades === '' || habilidade.descricao.toLowerCase().includes(searchHabilidades.toLowerCase()))
    )
    setFilteredHabilidades(filtered)
  }, [habilidades, formData.etapaEnsino, formData.tipoHabilidade, searchHabilidades, isEdit])

  // Filtro para alunos por pesquisa
  useEffect(() => {
    const filtered = alunos.filter(aluno =>
      (searchAlunos === '' || aluno.nomeCompleto.toLowerCase().includes(searchAlunos.toLowerCase()))
    )
    setFilteredAlunos(filtered)
  }, [alunos, searchAlunos])

  // Atualiza formData quando dateRange muda
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      dataInicio: dateRange.startDate.format('YYYY-MM-DD'),
      dataFim: dateRange.endDate ? dateRange.endDate.format('YYYY-MM-DD') : ''
    }))
  }, [dateRange])

  const formFields = useMemo<FormField[]>(
    () => {
      const fields: FormField[] = [
        {
          id: 'apelido',
          label: 'Nome do PDI',
          placeholder: '',
          value: formData.apelido
        }
      ];

      if (!isEdit) {
        fields.push(
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
          }
        );
      }

      return fields;
    },
    [formData.apelido, formData.etapaEnsino, formData.tipoHabilidade, isEdit] // Dependências específicas para evitar re-renders desnecessários
  )

  const handleInputChange = (id: string, value: string | number | null) => {
    const stringValue = value === null ? '' : String(value);
    setFormData(prev => ({ ...prev, [id]: stringValue }))
  }

  const handleDateRangeChange = ({ startDate, endDate }: { startDate: DateType; endDate: DateType }) => {
    setDateRange({
      startDate: dayjs(startDate),
      endDate: endDate ? dayjs(endDate) : null
    })
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
    if (!dateRange.startDate) {
      showAlert('Erro', 'Data de início é obrigatória.')
      return
    }
    if (!dateRange.endDate) {
      showAlert('Erro', 'Data de fim é obrigatória.')
      return
    }
    if (dateRange.endDate.isBefore(dateRange.startDate)) {
      showAlert('Erro', 'Data de fim deve ser posterior à data de início.')
      return
    }
    setLoading(true)
    try {
      let planejamentoIdFinal: number
      const basePayload = {
        apelido: formData.apelido,
        dataInicio: dateRange.startDate.format('YYYY-MM-DD'),
        dataFim: dateRange.endDate.format('YYYY-MM-DD')
      }

      if (isEdit) {
        // Atualiza o planejamento
        await atualizarPlanejamento({
          ...basePayload,
          id: planejamentoId!
        })
        planejamentoIdFinal = planejamentoId!
      } else {
        // Cria novo planejamento
        await cadastrarPlanejamento(basePayload)
        // Busca o planejamento criado pelo apelido e dataInicio (assumindo unicidade)
        const latestPlanejamentos = await buscarPlanejamento()
        const createdPlanning = latestPlanejamentos.find(p => p.apelido === basePayload.apelido && p.dataInicio === basePayload.dataInicio)
        if (!createdPlanning) {
          throw new Error('Não foi possível encontrar o planejamento criado')
        }
        planejamentoIdFinal = createdPlanning.id
      }

      // Nota: Para sincronizar completamente, seria ideal remover vínculos antigos não selecionados.
      // Como não há endpoint de desvincular, apenas adicionamos os selecionados (pode duplicar se já existirem).
      // Em produção, implementar diff e desvincular se necessário.

      // Vincula apenas os novos alunos selecionados (que não estavam originalmente vinculados)
      const newAlunos = selectedAlunos.filter(aluno => !originalSelectedAlunos.some(orig => orig.id === aluno.id))
      for (const aluno of newAlunos) {
        if (aluno.id) {
          await vincularAluno({
            idPlanejamento: planejamentoIdFinal,
            idAluno: aluno.id
          })
        }
      }

      // Vincula apenas as novas habilidades selecionadas (que não estavam originalmente vinculadas)
      const newHabilidades = selectedHabilidades.filter(hab => !originalSelectedHabilidades.some(orig => orig.id === hab.id))
      for (const hab of newHabilidades) {
        if (hab.id) {
          await vincularHabilidade({
            idPlanejamento: planejamentoIdFinal,
            idHabilidade: hab.id
          })
        }
      }

      // Show success alert with navigation on dismiss
      showAlert('Sucesso', `PDI ${isEdit ? 'atualizado' : 'criado'} com sucesso!`, [
        {
          text: 'OK',
          onPress: () => {
            handleDismiss();
            router.back();
          }
        }
      ]);
    } catch (error) {
      console.error('Erro no handleSave:', error)
      showAlert('Erro', 'Falha ao salvar PDI.')
    } finally {
      setLoading(false)
    }
  }

  const renderFormItem = (field: FormField, index: number) => (
    <View
      key={field.id}
      style={[styles.inputContainer, { zIndex: formFields.length - index }]}
    >
      <InputField
        {...field}
        onChangeText={field.options ? undefined : (text: string) => handleInputChange(field.id, text)}
        onValueChange={field.options ? (value: string | number | null) => handleInputChange(field.id, value) : undefined}
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

        {!isEdit ? (
          <View style={styles.habilidadesSection}>
            <Text style={styles.tituloHabilidades}>Habilidades Gerais</Text>
            <View style={styles.searchContainer}>
              <InputField
                label="Pesquisar habilidades"
                placeholder="Digite para filtrar por descrição..."
                value={searchHabilidades}
                onChangeText={setSearchHabilidades}
              />
            </View>
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
        ) : (
          <View style={styles.habilidadesSection}>
            <Text style={styles.tituloHabilidades}>Habilidades Selecionadas</Text>
            <FlatList
              data={selectedHabilidades}
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
        )}

         {/* Seção do DatePicker para range de datas */}
        <View style={styles.datePickerSection}>
          <Text style={styles.labelDatePicker}>Período do PDI</Text>
          <DatePicker
            mode="range"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={handleDateRangeChange}
            minDate={dayjs().subtract(1, 'year')} // Limite: 1 ano atrás
            maxDate={dayjs().add(2, 'year')} // Limite: 2 anos à frente
            styles={datePickerStyles}
          />
          <Text style={styles.dateDisplay}>
            Início: {dateRange.startDate.format('DD/MM/YYYY')}{' '}
            {dateRange.endDate ? `| Fim: ${dateRange.endDate.format('DD/MM/YYYY')}` : ''}
          </Text>
        </View>


        <View style={styles.alunosSection}>
          <Text style={styles.tituloHabilidades}>Meus Alunos</Text>
          <View style={styles.searchContainer}>
            <InputField
              label="Pesquisar alunos"
              placeholder="Digite para filtrar por nome..."
              value={searchAlunos}
              onChangeText={setSearchAlunos}
            />
          </View>
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
          title={loading ? 'Salvando...' : (isEdit ? 'Atualizar PDI' : 'Criar PDI')}
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
  searchContainer: {
    marginBottom: 10,
  },
  datePickerSection: {
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary || '#ddd',
    elevation: 2,
    boxShadow: ' 0px 2px 4px rgba(0, 0, 0, 0.25)',
  },
  labelDatePicker: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center'
  },
  dateDisplay: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Nunito_400Regular'
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
    boxShadow: ' 0px 2px 4px rgba(0, 0, 0, 0.1)',
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