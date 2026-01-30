import { colors } from '@packages/ui/theme/theme'
import Header from '@src/components/Header'
import InputField from '@src/components/InputField'
import { buscarHabilidades } from '@src/services/habilidadeService'
import { buscarAlunos } from '@src/services/alunoService'
import {
  buscarPlanejamentoPorId,
  atualizarPlanejamento,
  cadastrarPlanejamento,
  buscarPlanejamento,
  vincularAluno,
  vincularHabilidade,
  vincularEstrategia,
  vincularAvaliacao
} from '@src/services/planejamentoService'
import { buscarEstrategias } from '@src/services/estrategiasService'

import { Habilidade } from '@src/types/habilidade'
import { Aluno } from '@src/types/aluno'
import { Estrategia } from '@src/types/estrategia'

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { CheckSquare, Square } from 'phosphor-react-native'
import { CustomAlert, useCustomAlert } from '@src/hooks/useCustomAlert'
import CustomButton from '@src/components/CustomButton'
import dayjs from 'dayjs'
import DatePicker, { DateType } from 'react-native-ui-datepicker'
import { Avaliacao } from '@src/types/avaliacao'
import { buscarAvaliacoes } from '@src/services/avaliacaoService'
import { set } from 'react-hook-form'
import AlunoSelection from '@src/components/AlunoSelection'
import { buscarEscolas } from '@src/services/escolasService'
import { Escola } from '@src/types/escolas'

interface FormField {
  id: string
  label: string
  placeholder: string
  value: string
  options?: { label: string; value: string }[]
}

export default function PlanejamentoScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showAlert, handleDismiss, visible, config } = useCustomAlert()

  // CORRIGIDO: garantir que planejamentoId seja número válido
  const planejamentoId = params.id ? Number(params.id) : null
  const isEdit = !!params.id && !isNaN(Number(params.id))

  // Estados
  const [habilidades, setHabilidades] = useState<Habilidade[]>([])
  const [estrategias, setEstrategias] = useState<Estrategia[]>([])
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [escolas, setEscolas] = useState<Escola[]>([])

  const [filteredHabilidades, setFilteredHabilidades] = useState<Habilidade[]>([])
  const [filteredEstrategias, setFilteredEstrategias] = useState<Estrategia[]>([])
  const [filteredAvaliacoes, setFilteredAvaliacoes] = useState<Avaliacao[]>([])
  const [filteredAlunos, setFilteredAlunos] = useState<Aluno[]>([])

  const [selectedHabilidades, setSelectedHabilidades] = useState<Habilidade[]>([])
  const [selectedEstrategias, setSelectedEstrategias] = useState<Estrategia[]>([])
  const [selectedAvaliacoes, setSelectedAvaliacoes] = useState<Avaliacao[]>([])
  const [selectedAlunos, setSelectedAlunos] = useState<Aluno[]>([])

  const [originalSelectedHabilidades, setOriginalSelectedHabilidades] = useState<Habilidade[]>([])
  const [originalSelectedEstrategias, setOriginalSelectedEstrategias] = useState<Estrategia[]>([])
  const [originalSelectedAvaliacoes, setOriginalSelectedAvaliacoes] = useState<Avaliacao[]>([])
  const [originalSelectedAlunos, setOriginalSelectedAlunos] = useState<Aluno[]>([])

  const [searchHabilidades, setSearchHabilidades] = useState('')
  const [searchEstrategias, setSearchEstrategias] = useState('')
  const [searchAvaliacoes, setSearchAvaliacoes] = useState('')
  const [searchAlunos, setSearchAlunos] = useState('')

  const [formData, setFormData] = useState({
    apelido: '',
    etapaEnsino: '',
    tipoHabilidade: '',
    descicaoPlanejamento: '',
    dataInicio: '',
    dataFim: ''
  })

  const [dateRange, setDateRange] = useState({
    startDate: dayjs(),
    endDate: null as dayjs.Dayjs | null
  })

  const [loading, setLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const getEtapaEnsinoLabel = (value: string) => {
    const map: Record<string, string> = {
      '1': 'Educação Infantil',
      '2': 'Fundamental I',
      '3': 'Fundamental II',
      '4': 'Ensino Médio',
    }
    return map[value] || 'Não informado'
  }

  const getTipoHabilidadeLabel = (value: string) => {
    const map: Record<string, string> = {
      '1': 'Cognitivo',
      '2': 'Socioemocional',
      '3': 'Comunicação',
      '4': 'Motora',
    }
    return map[value] || 'Não informado'
  }

  const datePickerStyles = {
    selected: { backgroundColor: colors.primary },
    selected_label: { color: '#fff' },
    inRange: { backgroundColor: `${colors.primary}20` },
    rangeStart: { backgroundColor: colors.primary },
    rangeEnd: { backgroundColor: colors.primary },
    rangeStart_label: { color: '#fff' },
    rangeEnd_label: { color: '#fff' }
  }

  // Carregamento inicial
  useEffect(() => {
    const load = async () => {
      const [habs, ests, aval, als, escs] = await Promise.all([
        buscarHabilidades(),
        buscarEstrategias(),
        buscarAvaliacoes(),
        buscarAlunos(),
        buscarEscolas()
      ])
      setHabilidades(habs)
      setFilteredHabilidades(habs)
      setEstrategias(ests)
      setFilteredEstrategias(ests)
      setAvaliacoes(aval),
        setFilteredAvaliacoes(aval),
        setAlunos(als)
      setFilteredAlunos(als),
      setEscolas(escs)
    }
    load()
  }, [])

  // Carregar dados em modo edição
  useEffect(() => {
    if (isEdit && planejamentoId) {
      fetchPlanejamentoData()
    } else {
      // Novo PDI
      const today = dayjs()
      setDateRange({ startDate: today, endDate: null })
      setFormData(prev => ({ ...prev, dataInicio: today.format('YYYY-MM-DD') }))
    }
  }, [isEdit, planejamentoId])

  const fetchPlanejamentoData = async () => {
    if (!planejamentoId) return
    setIsLoadingData(true)
    try {
      const p = await buscarPlanejamentoPorId(planejamentoId)

      setFormData({
        apelido: p.apelido || '',
        etapaEnsino: '',
        tipoHabilidade: '',
        descicaoPlanejamento: p.descicaoPlanejamento || '',
        dataInicio: p.dataInicio || '',
        dataFim: p.dataFim || ''
      })

      setDateRange({
        startDate: p.dataInicio ? dayjs(p.dataInicio) : dayjs(),
        endDate: p.dataFim ? dayjs(p.dataFim) : null
      })

      const habs = p.habilidades || []
      const ests = p.estrategias || []
      const aval = p.avaliacao || []
      const als = p.alunos?.filter(a => a.id) || []

      setSelectedHabilidades(habs)
      setOriginalSelectedHabilidades(habs)
      setSelectedEstrategias(ests)
      setOriginalSelectedEstrategias(ests)
      setSelectedAvaliacoes(aval)
      setOriginalSelectedAvaliacoes(aval)
      setSelectedAlunos(als)
      setOriginalSelectedAlunos(als)
    } catch (err) {
      showAlert('Erro', 'Não foi possível carregar o PDI.')
    } finally {
      setIsLoadingData(false)
    }
  }

  // Filtros (apenas em criação)
  useEffect(() => {
    const etapa = formData.etapaEnsino ? Number(formData.etapaEnsino) : null
    const tipo = formData.tipoHabilidade || null

    const filtered = habilidades.filter(h => {
      const matchesEtapa = !etapa || h.idNivelEnsino === etapa
      const matchesTipo = !tipo || h.tipo === tipo
      const matchesSearch = searchHabilidades === '' ||
        h.descricao?.toLowerCase().includes(searchHabilidades.toLowerCase())

      return matchesEtapa && matchesTipo && matchesSearch
    })

    setFilteredHabilidades(filtered)
  }, [habilidades, formData.etapaEnsino, formData.tipoHabilidade, searchHabilidades])

  useEffect(() => {
    const filtered = estrategias.filter(e =>
      searchEstrategias === '' ||
      e.descricao?.toLowerCase().includes(searchEstrategias.toLowerCase())
    )
    setFilteredEstrategias(filtered)
  }, [estrategias, searchEstrategias])

  useEffect(() => {
    const filtered = avaliacoes.filter(e =>
      searchAvaliacoes === '' ||
      e.descricao?.toLowerCase().includes(searchAvaliacoes.toLowerCase())
    )
    setFilteredAvaliacoes(filtered)
  }, [avaliacoes, searchAvaliacoes])

  useEffect(() => {
    const filtered = alunos.filter(a =>
      searchAlunos === '' ||
      a.nomeCompleto.toLowerCase().includes(searchAlunos.toLowerCase())
    )
    setFilteredAlunos(filtered)
  }, [alunos, searchAlunos])

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      dataInicio: dateRange.startDate.format('YYYY-MM-DD'),
      dataFim: dateRange.endDate ? dateRange.endDate.format('YYYY-MM-DD') : ''
    }))
  }, [dateRange])

  const formFields = useMemo<FormField[]>(() => [
    {
      id: 'apelido',
      label: 'Nome do PDI',
      placeholder: 'Ex: PDI 2025 - João',
      value: formData.apelido,
    },
    {
      id: 'etapaEnsino',
      label: 'Etapa de Ensino',
      placeholder: 'Selecione',
      value: formData.etapaEnsino,
      // Só permite edição quando NÃO está em modo edição
      options: [
        { label: 'Educação Infantil', value: '1' },
        { label: 'Fundamental I', value: '2' },
        { label: 'Fundamental II', value: '3' },
        { label: 'Ensino Médio', value: '4' },
      ],
      disabled: isEdit, // <- chave para bloquear edição
      // Opcional: texto que será exibido quando estiver em modo leitura
      displayValue: isEdit ? getEtapaEnsinoLabel(formData.etapaEnsino) : undefined,
    },
    {
      id: 'tipoHabilidade',
      label: 'Tipo de Habilidade',
      placeholder: 'Selecione',
      value: formData.tipoHabilidade,
      options: [
        { label: 'Cognitivo', value: '1' },
        { label: 'Socioemocional', value: '2' },
        { label: 'Comunicação', value: '3' },
        { label: 'Motora', value: '4' },
      ],
      disabled: isEdit,
      displayValue: isEdit ? getTipoHabilidadeLabel(formData.tipoHabilidade) : undefined,
    },

    {
      id: 'descricaoPlanejamento',
      label: 'Resumo do Planejamento',
      placeholder: 'Escreva...',
      value: formData.descicaoPlanejamento,
      multiline: true,                    // ← permite várias linhas

      onChangeText: (text: any) => handleInputChange('descicaoPlanejamento', text),
    },
  ], [
    formData.apelido,
    formData.etapaEnsino,
    formData.tipoHabilidade,
    formData.descicaoPlanejamento,
    isEdit,
  ])

  const handleInputChange = (id: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [id]: value === null ? '' : String(value) }))
  }

  const handleDateRangeChange = ({ startDate, endDate }: { startDate: DateType; endDate: DateType }) => {
    setDateRange({
      startDate: dayjs(startDate),
      endDate: endDate ? dayjs(endDate) : null
    })
  }

  // Toggle seguro
  const toggle = <T extends { id?: number; descricao?: string; nomeCompleto?: string }>(
    item: T,
    selected: T[],
    setSelected: React.Dispatch<React.SetStateAction<T[]>>,
    label: string
  ) => {
    if (!item.id) return showAlert('Atenção', 'Item sem ID não pode ser selecionado.')
    const exists = selected.some(i => i.id === item.id)
    if (exists) {
      setSelected(prev => prev.filter(i => i.id !== item.id))
      showAlert('Removido', `${label} removido(a)`)
    } else {
      setSelected(prev => [...prev, item])
      showAlert('Adicionado', `${label} adicionado(a)`)
    }
  }

  const toggleHabilidade = (h: Habilidade) => toggle(h, selectedHabilidades, setSelectedHabilidades, h.descricao || 'Habilidade')
  const toggleEstrategia = (e: Estrategia) => toggle(e, selectedEstrategias, setSelectedEstrategias, e.descricao || 'Estratégia')
  const toggleAvaliacao = (v: Avaliacao) => toggle(v, selectedAvaliacoes, setSelectedAvaliacoes, v.descricao || 'Avaliação')
  const toggleAluno = (a: Aluno) => toggle(a, selectedAlunos, setSelectedAlunos, a.nomeCompleto || 'Aluno')

  // Vincular apenas os novos
  const vincularNovos = async <T extends { id?: number }>(
    novos: T[],
    originais: T[],
    vincularFn: (p: any) => Promise<void>,
    payloadFn: (item: T & { id: number }) => any
  ) => {
    const diff = novos
      .filter((n): n is T & { id: number } => !!n.id && !originais.some(o => o.id === n.id))
    if (diff.length > 0) {
      await Promise.all(diff.map(item => vincularFn(payloadFn(item))))
    }
  }

  const handleSave = async () => {
    if (!formData.apelido.trim()) return showAlert('Erro', 'Nome do PDI é obrigatório')
    if (selectedAlunos.length === 0) return showAlert('Erro', 'Selecione pelo menos um aluno')
    if (!dateRange.endDate) return showAlert('Erro', 'Selecione a data final')
    if (dateRange.endDate.isBefore(dateRange.startDate)) return showAlert('Erro', 'Data final deve ser posterior')


    setLoading(true)
    try {
      let planejamentoIdFinal: number

      const payload = {
        apelido: formData.apelido,
        dataInicio: dateRange.startDate.format('YYYY-MM-DD'),
        dataFim: dateRange.endDate.format('YYYY-MM-DD')
      }


      if (isEdit && planejamentoId) {
        // Atualizar
        await atualizarPlanejamento({ ...payload, id: planejamentoId })
        planejamentoIdFinal = planejamentoId

      } else {
        // Criar
        await cadastrarPlanejamento(payload)
        const lista = await buscarPlanejamento()
        const novo = lista.find(p => p.apelido === payload.apelido && p.dataInicio === payload.dataInicio)
        if (!novo) throw new Error('PDI criado, mas não encontrado na lista')
        planejamentoIdFinal = novo.id
      }

      // Vincular apenas os novos
      await vincularNovos(
        selectedEstrategias,
        originalSelectedEstrategias,
        vincularEstrategia,
        e => ({
          idPlanejamento: planejamentoIdFinal,
          idEstrategia: e.id
        })
      )

      // Vincular apenas os novos — ALUNOS
      await vincularNovos(
        selectedAlunos,
        originalSelectedAlunos,
        vincularAluno,
        a => ({
          idPlanejamento: planejamentoIdFinal,
          idAluno: a.id
        })
      )

      // Vincular apenas os novos — HABILIDADES
      await vincularNovos(
        selectedHabilidades,
        originalSelectedHabilidades,
        vincularHabilidade,
        h => ({
          idPlanejamento: planejamentoIdFinal,
          idHabilidade: h.id
        })
      )

      // Vincular apenas os novos — AVALIAÇÕES
      await vincularNovos(
        selectedAvaliacoes,
        originalSelectedAvaliacoes,
        vincularAvaliacao,
        v => ({
          idPlanejamento: planejamentoIdFinal,
          idAvaliacao: v.id
        })
      )

      showAlert('Sucesso!', `PDI ${isEdit ? 'atualizado' : 'criado'} com sucesso!`, [
        { text: 'OK', onPress: () => { handleDismiss(); router.back() } }
      ])
    } catch (err: any) {
      console.error('Erro ao salvar PDI:', err)
      showAlert('Erro', err.message || 'Falha ao salvar o PDI.')
    } finally {
      setLoading(false)
    }
  }

  const renderItem = <T extends { id?: number; descricao?: string; nomeCompleto?: string }>(
    item: T,
    selected: boolean,
    onPress: () => void,
    label: 'descricao' | 'nomeCompleto'
  ) => {
    const text = label === 'descricao' ? item.descricao : item.nomeCompleto
    const disabled = !item.id

    return (
      <TouchableOpacity
        style={[styles.item, selected && styles.itemSelected, disabled && styles.itemDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.itemText, disabled && styles.textDisabled]}>
          {text || 'Sem nome'}
          {disabled && ' (indisponível)'}
        </Text>
        {selected ? <CheckSquare size={24} color={colors.primary} weight="fill" /> : <Square size={24} color={disabled ? '#ccc' : colors.primary} weight="regular" />}
      </TouchableOpacity>
    )
  }

  const renderHabilidade = ({ item }: { item: Habilidade }) => renderItem(item, selectedHabilidades.some(s => s.id === item.id), () => toggleHabilidade(item), 'descricao')
  const renderEstrategia = ({ item }: { item: Estrategia }) => renderItem(item, selectedEstrategias.some(s => s.id === item.id), () => toggleEstrategia(item), 'descricao')
  const renderAvaliacao = ({ item }: { item: Avaliacao }) => renderItem(item, selectedAvaliacoes.some(s => s.id === item.id), () => toggleAvaliacao(item), 'descricao')
  const renderAluno = ({ item }: { item: Aluno }) => renderItem(item, selectedAlunos.some(s => s.id === item.id), () => toggleAluno(item), 'nomeCompleto')

  if (isLoadingData) {
    return (
      <View style={styles.container}>
        <Header title="Carregando..." onBack={() => router.back()} fixed />
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Header title={isEdit ? 'Editar PDI' : 'Criar PDI'} onBack={() => router.back()} fixed />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Campos principais */}
        {formFields.map((f, i) => (
          <View key={f.id} style={{ marginBottom: 15, zIndex: 999 - i }}>
            <InputField
              {...f}
              onChangeText={f.options ? undefined : t => handleInputChange(f.id, t)}
              onValueChange={f.options ? v => handleInputChange(f.id, v) : undefined}
            />
          </View>
        ))}

        {/* HABILIDADES - AGORA FUNCIONA EM EDIÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Habilidades {isEdit ? '(vinculadas e disponíveis)' : 'a trabalhar'}
          </Text>
          <InputField
            label="Buscar habilidade"
            placeholder="Digite para filtrar..."
            value={searchHabilidades}
            onChangeText={setSearchHabilidades}
            style={{ marginBottom: 10 }}
          />
          <FlatList
            data={filteredHabilidades}
            renderItem={renderHabilidade}
            keyExtractor={item => item.id?.toString() ?? 'temp'}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                Nenhuma habilidade encontrada
              </Text>
            }
          />
          <Text style={styles.summary}>
            Selecionadas: {selectedHabilidades.length}
          </Text>
        </View>

        {/* ESTRATÉGIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Estratégias de Ensino {isEdit ? '(vinculadas e disponíveis)' : ''}
          </Text>
          <InputField
            label="Buscar estratégia"
            placeholder="Digite para filtrar..."
            value={searchEstrategias}
            onChangeText={setSearchEstrategias}
            style={{ marginBottom: 10 }}
          />
          <FlatList
            data={filteredEstrategias}
            renderItem={renderEstrategia}
            keyExtractor={item => item.id?.toString() ?? 'temp'}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                Nenhuma estratégia encontrada
              </Text>
            }
          />
          <Text style={styles.summary}>
            Selecionadas: {selectedEstrategias.length}
          </Text>
        </View>

        {/* CRITÉRIOS AVALIATIVOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Critérios Avaliativos {isEdit ? '(vinculados e disponíveis)' : ''}
          </Text>
          <InputField
            label="Buscar critério"
            placeholder="Digite para filtrar..."
            value={searchAvaliacoes}
            onChangeText={setSearchAvaliacoes}
            style={{ marginBottom: 10 }}
          />
          <FlatList
            data={filteredAvaliacoes}
            renderItem={renderAvaliacao}
            keyExtractor={item => item.id?.toString() ?? 'temp'}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                Nenhum critério encontrado
              </Text>
            }
          />
          <Text style={styles.summary}>
            Selecionados: {selectedAvaliacoes.length}
          </Text>
        </View>

        {/* Período */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Período do PDI</Text>
          <DatePicker
            mode="range"
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={handleDateRangeChange}
            styles={datePickerStyles}
          />
          <Text style={styles.dateText}>
            {dateRange.startDate.format('DD/MM/YYYY')} →{' '}
            {dateRange.endDate?.format('DD/MM/YYYY') || '...'}
          </Text>
        </View>

        {/* Alunos */}
       <AlunoSelection
          alunos={alunos}
          escolas={escolas}
          selectedAlunos={selectedAlunos}
          onToggleAluno={toggleAluno}
        />
      </ScrollView>

      <View style={styles.footer}>
        <CustomButton
          title={loading ? 'Salvando...' : (isEdit ? 'Atualizar PDI' : 'Criar PDI')}
          onPress={handleSave}
          disabled={loading}
          buttonColor={{ backgroundColor: colors.primary2 }}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 90 },
  section: { marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, textAlign: 'center', marginBottom: 12 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2
  },
  itemSelected: { backgroundColor: '#e3f2fd', borderColor: colors.primary, borderWidth: 2 },
  itemDisabled: { opacity: 0.5, backgroundColor: '#f9f9f9' },
  itemText: { flex: 1, fontSize: 16, color: colors.primary },
  textDisabled: { color: '#999' },
  summary: { marginTop: 12, textAlign: 'center', color: colors.primary, fontWeight: '600' },
  dateSection: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginVertical: 20, elevation: 2 },
  dateText: { textAlign: 'center', marginTop: 10, color: colors.primary, fontSize: 15 },
  footer: { padding: 20, backgroundColor: colors.background }
})