import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native'
import { useRouter } from 'expo-router'
import { Bell, Camera, GraduationCap, User, Trash } from 'phosphor-react-native'
import { fetchCepData } from '../../services/validateCep'
import { fetchEstados, fetchMunicipios } from '../../services/locationsService'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { buscarEscolas } from '../../services/escolasService'
import Header from '../../components/Header'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import { Professor } from '@src/types/professor'
import { Escola } from '@src/types/escolas'
import {
  buscarProfessor,
  atualizarProfessor,
  vincularEscola,
  buscarEscolasProfessor
} from '../../services/professorService'
import { isCadastroCompleto } from '../../utils/professorUtils'
import ProfilePhoto from '@src/components/ProfilePhoto'
import ProgressFill from '@src/components/ProgressFill'
import { CheckboxWithLabel, InputField } from '@/packages/ui/components'
import CustomButton from '@src/components/CustomButton'
import SectionGroup from '@src/components/SectionGroup'
import ItemButton from '@src/components/ItemButton'
import { useCustomAlert } from '@src/hooks/useCustomAlert'

const HEADER_HEIGHT = 55
const areasEnsino = [
  'Matemática',
  'Português',
  'História',
  'Geografia',
  'Biologia',
  'Física',
  'Química',
  'Inglês',
  'Educação Física',
  'Artes'
]

const sexoOptions = [
  { label: 'Feminino', value: 'F' },
  { label: 'Masculino', value: 'M' }
]

interface InputFieldConfig {
  label: string
  key: keyof Professor
  placeholder: string
  mask?: 'cep' | 'phone' | 'cpf'
  options?: { label: string; value: string | number }[]
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'email-address'
    | 'phone-pad'
    | 'number-pad'
  onChange?: (value: string | number | null) => void
  isSpecial?: boolean
  editable?: boolean
}

interface SectionData {
  id: string
  title: string
  icon: React.ReactNode
  fields?: InputFieldConfig[]
  extraContent?: React.ReactNode
}

export default function CadastroProfessor() {
  const { showAlert } = useCustomAlert()
  const router = useRouter()
  const [professor, setProfessor] = useState<Professor>({
    nomeCompleto: '',
    sexo: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: 0,
    complemento: '',
    bairro: '',
    estado: '',
    cidade: '',
    telefone: '',
    disciplinas: '',
    nivelEnsino: '',
    sobre: '',
    aceitouTermos: false,
    escolas: []
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({}) // Novo: erros por campo
  const [loading, setLoading] = useState<boolean>(true)
  const [cepLoading, setCepLoading] = useState<boolean>(false)
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([])
  const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>(
    {}
  )
  const [escolas, setEscolas] = useState<Escola[]>([])
  const cidadesDisponiveis = professor.estado
    ? cidadesPorUf[professor.estado] || ['Selecione o estado primeiro']
    : ['Selecione o estado primeiro']
  const [completedSections, setCompletedSections] = useState<number>(0)
  const totalSections = 4
  const [escolasLoading, setEscolasLoading] = useState<boolean>(false)

  useEffect(() => {
    const calculateProgress = () => {
      let completed = 0
      const dadosPessoaisCompleto =
        professor.nomeCompleto &&
        professor.sexo &&
        professor.email &&
        professor.telefone
      const dadosProfissionaisCompleto = professor.escolas?.length > 0
      const preferenciasCompleto = true
      const termosCompleto = professor.aceitouTermos

      if (dadosPessoaisCompleto) completed += 1
      if (dadosProfissionaisCompleto) completed += 1
      if (preferenciasCompleto) completed += 1
      if (termosCompleto) completed += 1

      setCompletedSections(completed)
    }

    calculateProgress()
  }, [professor])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setEscolasLoading(true)
        const token = await AsyncStorage.getItem('authToken')
        if (!token) {
          console.warn('⚠️ Nenhum token encontrado. Usuário não autenticado.')
          showAlert('Aviso', 'Por favor, faça login para carregar seus dados.')
          setLoading(false)
          setEscolasLoading(false)
          return
        }

        const estadosData = await fetchEstados()
        const formattedUfs = estadosData.map(uf => ({
          label: uf.nome,
          value: uf.sigla
        }))
        setUfs(formattedUfs)

        const municipiosData = await fetchMunicipios('RS')
        const cidadesRS = municipiosData.map(m => m.nome)
        setCidadesPorUf(prev => ({ ...prev, RS: cidadesRS }))

        const escolasData = await buscarEscolas()
        console.log('✅ Escolas recebidas:', escolasData)
        if (!escolasData.length) {
          showAlert(
            'Aviso',
            'Nenhuma escola encontrada. Verifique sua conexão ou tente novamente.'
          )
        }
        setEscolas(escolasData)

        const professorData = await buscarProfessor()
        console.log('✅ Dados do professor recebidos:', professorData)
        let updatedProfessor: Professor = {
          ...professorData.objeto,
          sexo:
            professorData.objeto.sexo &&
            ['F', 'M'].includes(professorData.objeto.sexo)
              ? professorData.objeto.sexo
              : '',
          escolas: [] as string[]
        }

        try {
          const linkedEscolas = await buscarEscolasProfessor()
          console.log('✅ Escolas vinculadas recebidas:', linkedEscolas)
          updatedProfessor.escolas = linkedEscolas.map(escola =>
            escola.id!.toString()
          )
        } catch (error: any) {
          console.warn('⚠️ Falha ao buscar escolas vinculadas:', error.message)
          showAlert(
            'Aviso',
            'Não foi possível carregar as escolas vinculadas. Você pode vincular escolas manualmente.'
          )
        }

        try {
          const linkedEscolas = await buscarEscolasProfessor()
          console.log('✅ Escolas vinculadas recebidas:', linkedEscolas)
          updatedProfessor.escolas = linkedEscolas.map(escola =>
            escola.id!.toString()
          )
        } catch (error: any) {
          console.warn('⚠️ Falha ao buscar escolas vinculadas:', error.message)
          Alert.alert(
            'Aviso',
            'Não foi possível carregar as escolas vinculadas. Você pode vincular escolas manualmente.'
          )
        }

        setProfessor(updatedProfessor)
        console.log('Professor state:', updatedProfessor)
      } catch (error: any) {
        console.error('❌ Erro ao carregar dados iniciais:', error.message)
        if (error.message.includes('401')) {
          showAlert(
            'Erro de Autenticação',
            'Sua sessão expirou. Faça login novamente.'
          )
          router.push('/auth/login')
        } else {
          showAlert(
            'Erro',
            'Não foi possível carregar os dados. Preencha manualmente.'
          )
          setProfessor(prev => ({
            ...prev,
            estado: 'SP',
            cidade: 'São Paulo',
            sexo: '',
            escolas: []
          }))
        }
      } finally {
        setLoading(false)
        setEscolasLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // Novo: Função para validar campo e atualizar erros
  const validateField = (
    key: keyof Professor,
    value: string | number | null
  ) => {
    let newErrors = { ...errors }
    delete newErrors[key as string] // Limpa erro anterior

    switch (key) {
      case 'nomeCompleto':
        if (!value || (value as string).trim().length < 2) {
          newErrors['nomeCompleto'] = 'Nome deve ter pelo menos 2 caracteres'
        }
        break
      case 'email':
        if (!value || !/^\S+@\S+\.\S+$/.test(value as string)) {
          newErrors['email'] = 'E-mail inválido'
        }
        break
      case 'telefone':
        if (!value || (value as string).replace(/\D/g, '').length < 10) {
          newErrors['telefone'] = 'Telefone inválido'
        }
        break
      case 'sexo':
        if (!value) {
          newErrors['sexo'] = 'Selecione o sexo'
        }
        break
      case 'escolas':
        if ((professor.escolas?.length || 0) === 0) {
          newErrors['escolas'] = 'Vincule pelo menos uma escola'
        }
        break
      // Adicione mais validações conforme necessário (ex.: CEP, etc.)
      default:
        break
    }

    setErrors(newErrors)
  }

  const handleCepChange = async (text: string) => {
    const cepClean = text.replace(/[^0-9]/g, '')
    setProfessor({ ...professor, cep: cepClean })
    validateField('cep', cepClean) // Valida CEP se necessário

    if (cepClean.length === 8) {
      setCepLoading(true)
      try {
        const cepData = await fetchCepData(cepClean)
        setProfessor(prev => ({
          ...prev,
          logradouro: cepData.street || '',
          bairro: cepData.neighborhood || '',
          estado: cepData.state || '',
          cidade: cepData.city || ''
        }))

        if (cepData.state && !cidadesPorUf[cepData.state]) {
          const municipiosData = await fetchMunicipios(cepData.state)
          const cidades = municipiosData.map(m => m.nome)
          setCidadesPorUf(prev => ({ ...prev, [cepData.state]: cidades }))
        }
      } catch (error: any) {
        console.error('Erro ao buscar CEP:', error)
        if (error.name === 'BadRequestError') {
          showAlert('Erro de Validação', error.message)
        } else if (error.name === 'NotFoundError') {
          showAlert('Erro', 'CEP não encontrado.')
        } else if (error.name === 'InternalError') {
          showAlert('Erro', 'Erro interno no serviço de CEP.')
        } else {
          showAlert(
            'Erro',
            error.message || 'Não foi possível buscar o endereço.'
          )
        }
      } finally {
        setCepLoading(false)
      }
    }
  }

  const handleConcluir = async () => {
    console.log('Professor state:', professor)
    // Valida todos os campos antes de salvar
    const requiredFields = [
      'nomeCompleto',
      'email',
      'telefone',
      'sexo',
      'escolas'
    ] as (keyof Professor)[]
    let hasErrors = false
    const newErrors: { [key: string]: string } = {}

    requiredFields.forEach(key => {
      const value = professor[key]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[key] = `${key} é obrigatório`
        hasErrors = true
      }
    })

    if (professor.escolas?.length === 0) {
      newErrors['escolas'] = 'Vincule pelo menos uma escola'
      hasErrors = true
    }

    setErrors(newErrors)

    if (hasErrors) {
      showAlert(
        'Validação',
        'Corrija os erros nos campos destacados antes de continuar.'
      )
      return
    }

    if (!isCadastroCompleto(professor)) {
      showAlert(
        'Erro',
        'Preencha todos os campos obrigatórios, incluindo pelo menos uma escola vinculada.'
      )
      return
    }

    setLoading(true)
    try {
      await atualizarProfessor(professor)
      showAlert('Sucesso', 'Cadastro de professor salvo com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error: any) {
      console.error('Erro ao salvar professor:', error)
      if (error.message.includes('erro ao vincular escolas')) {
        showAlert(
          'Aviso',
          'Cadastro de professor salvo, mas não foi possível vincular as escolas: ' +
            error.message,
          [{ text: 'OK', onPress: () => router.back() }]
        )
      } else if (error.message.includes('401')) {
        showAlert(
          'Erro de Autenticação',
          'Sua sessão expirou. Faça login novamente.'
        )
        router.push('/auth/login')
      } else if (error.response?.status === 400) {
        showAlert(
          'Erro',
          'Dados inválidos. Verifique os campos e tente novamente.'
        )
      } else {
        showAlert(
          'Erro',
          'Não foi possível salvar o cadastro. Tente novamente.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const addEscola = (value: string) => {
    if (
      value &&
      typeof value === 'string' &&
      !professor.escolas.includes(value)
    ) {
      setProfessor(prev => ({
        ...prev,
        escolas: [...(prev.escolas || []), value]
      }))
      validateField('escolas', null) // Valida após adicionar (passa null para escolas)
    }
  }

  const removeEscola = (escolaToRemove: string) => {
    setProfessor(prev => ({
      ...prev,
      escolas: (prev.escolas || []).filter(escola => escola !== escolaToRemove)
    }))
    validateField('escolas', null) // Revalida (passa null para escolas)
  }

  const renderItems = (fields: InputFieldConfig[]) => {
    return fields.map(field => {
      const fieldKey = field.key as string
      const fieldValue = professor[field.key]
      const error = errors[fieldKey]

      if (field.isSpecial && field.key === 'cep') {
        return (
          <View key={field.key}>
            <InputField
              label={field.label}
              placeholder={field.placeholder}
              value={(professor[field.key] as string) || ''}
              onChangeText={value => {
                handleCepChange(value)
                validateField(field.key, value) // Valida em tempo real
              }}
              editable={!cepLoading}
              mask={field.mask}
              keyboardType={field.keyboardType}
              error={error} // Novo: passa erro para InputField
            />
            {cepLoading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        )
      }

      if (field.isSpecial && field.key === 'estado') {
        return (
          <InputField
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            options={ufs}
            selectedValue={(professor[field.key] as string) || ''}
            onValueChange={value => {
              const stateValue = value?.toString() || ''
              setProfessor({ ...professor, estado: stateValue, cidade: '' })
              validateField(field.key, stateValue) // Valida em tempo real
              if (stateValue && !cidadesPorUf[stateValue]) {
                fetchMunicipios(stateValue)
                  .then(municipiosData => {
                    const cidades = municipiosData.map(m => m.nome)
                    setCidadesPorUf(prev => ({
                      ...prev,
                      [stateValue]: cidades
                    }))
                  })
                  .catch(err => console.error('Erro ao carregar cidades:', err))
              }
            }}
            error={error} // Novo: passa erro para InputField
          />
        )
      }

      if (field.isSpecial && field.key === 'cidade') {
        return (
          <InputField
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            options={cidadesDisponiveis.map(cidade => ({
              label: cidade,
              value: cidade
            }))}
            selectedValue={(professor[field.key] as string) || ''}
            onValueChange={value => {
              const cityValue = value?.toString() || ''
              setProfessor({ ...professor, cidade: cityValue })
              validateField(field.key, cityValue) // Valida em tempo real
            }}
            error={error} // Novo: passa erro para InputField
          />
        )
      }

      if (field.key === 'escolas') {
        return (
          <View key={field.key}>
            <InputField
              label={field.label}
              placeholder={field.placeholder}
              options={field.options}
              selectedValue=""
              onValueChange={value => {
                if (value && typeof value === 'string') {
                  addEscola(value)
                }
              }}
              editable={field.editable}
              error={error} // Novo: passa erro para InputField
            />
            {escolasLoading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            {professor.escolas.map((escolaId, index) => {
              const escola = escolas.find(e => e.id!.toString() === escolaId)
              return (
                <ItemButton
                  key={index}
                  escola={escola?.nomeInstituicao || escolaId}
                  onRemove={() => removeEscola(escolaId)}
                />
              )
            })}
          </View>
        )
      }

      return (
        <InputField
          key={field.key}
          label={field.label}
          placeholder={field.placeholder}
          value={
            field.key === 'numero'
              ? (professor[field.key] as number)?.toString() || ''
              : field.key === 'sexo'
                ? (professor[field.key] as string) || ''
                : (professor[field.key] as string) || ''
          }
          onChangeText={value => {
            if (field.key === 'numero') {
              const numValue = value === '' ? 0 : parseInt(value) || 0
              setProfessor({ ...professor, [field.key]: numValue })
              validateField(field.key, numValue) // Valida em tempo real
            } else if (field.options && field.onChange) {
              field.onChange(value)
            } else {
              setProfessor({ ...professor, [field.key]: value })
              validateField(field.key, value) // Valida em tempo real
            }
          }}
          mask={field.mask}
          options={field.options}
          keyboardType={field.keyboardType}
          selectedValue={
            field.key === 'sexo'
              ? (professor[field.key] as string) || ''
              : undefined
          }
          onValueChange={
            field.key === 'sexo' && field.options
              ? value => {
                  const sexoValue = typeof value === 'string' ? value : ''
                  setProfessor({ ...professor, sexo: sexoValue })
                  validateField('sexo', sexoValue) // Valida em tempo real
                }
              : undefined
          }
          error={error} // Novo: passa erro para InputField
        />
      )
    })
  }

  const sections: SectionData[] = [
    {
      id: 'dados-pessoais',
      title: 'Dados Pessoais',
      icon: <User size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: 'Nome',
          key: 'nomeCompleto',
          placeholder: 'Digite o nome'
        },
        {
          label: 'E-mail',
          key: 'email',
          placeholder: 'Digite o e-mail',
          keyboardType: 'email-address'
        },
        {
          label: 'Telefone',
          key: 'telefone',
          placeholder: '(00) 00000-0000',
          mask: 'phone'
        },
        {
          label: 'Sexo',
          key: 'sexo',
          placeholder: 'Selecione o sexo',
          options: sexoOptions,
          onChange: value => {
            const sexoValue = typeof value === 'string' ? value : ''
            setProfessor({ ...professor, sexo: sexoValue })
            validateField('sexo', sexoValue) // Valida em tempo real
          }
        },
        {
          label: 'CEP',
          key: 'cep',
          placeholder: 'Informe o CEP',
          mask: 'cep',
          isSpecial: true
        },
        {
          label: 'Estado',
          key: 'estado',
          placeholder: 'Informe o estado',
          isSpecial: true
        },
        {
          label: 'Cidade',
          key: 'cidade',
          placeholder: 'Informe a cidade',
          isSpecial: true
        },
        {
          label: 'Bairro',
          key: 'bairro',
          placeholder: 'Digite o bairro'
        },
        {
          label: 'Endereço',
          key: 'logradouro',
          placeholder: 'Digite o endereço'
        },
        {
          label: 'Número',
          key: 'numero',
          placeholder: 'Digite o número',
          keyboardType: 'number-pad'
        },
        {
          label: 'Complemento',
          key: 'complemento',
          placeholder: 'Digite o complemento'
        },
        {
          label: 'Sobre você',
          key: 'sobre',
          placeholder:
            'Conte um pouco sobre sua experiência metodologia de ensino...'
        }
      ]
    },
    {
      id: 'dados-profissionais | professor',
      title: 'Dados Profissionais',
      icon: <GraduationCap size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: 'Escola/Instituição vinculada',
          key: 'escolas',
          placeholder: escolasLoading
            ? 'Carregando escolas...'
            : 'Informe a escola/instituição',
          options:
            escolasLoading || !escolas
              ? []
              : escolas
                  .filter(escola => escola.nomeInstituicao && escola.id)
                  .map(escola => ({
                    label: escola.nomeInstituicao!,
                    value: escola.id!.toString()
                  })),
          editable: !escolasLoading
        }
      ],
      extraContent: null
    },
    {
      id: 'preferencias',
      title: 'Preferências',
      icon: <Bell size={16} weight="fill" color={colors.primary} />,
      fields: []
    }
  ]

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />

  const renderSection = ({ item }: { item: SectionData }) => (
    <SectionGroup title={item.title} icon={item.icon}>
      {item.fields && renderItems(item.fields)}
      {item.extraContent}
    </SectionGroup>
  )

  return (
    <View style={styles.container}>
      <Header
        title="Perfil do Professor"
        onBack={() => router.back()}
        fixed={true}
      />
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            {!isCadastroCompleto(professor) && (
              <View>
                <ProgressFill
                  completedSections={completedSections}
                  totalSections={totalSections}
                />
                <View>
                  <Text style={styles.titleInstrucao}>
                    Finalize seu cadastro!
                  </Text>
                  <Text style={styles.obsInstrucao}>
                    Seu cadastro não está completo. Conclua a configuração do
                    seu perfil para acessar todos os recursos da plataforma.
                  </Text>
                </View>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <>
            <View style={styles.checkboxRow}>
              <CheckboxWithLabel
                label="Aceito os termos e a política de privacidade"
                checked={professor.aceitouTermos}
                onPress={() =>
                  setProfessor(prev => ({
                    ...prev,
                    aceitouTermos: !prev.aceitouTermos
                  }))
                }
              />
            </View>
            <View style={styles.button}>
              <CustomButton
                title="Concluir Cadastro"
                onPress={handleConcluir}
                buttonColor={{ backgroundColor: colors.primary2 }}
                disabled={loading}
                loading={loading}
              />
            </View>
          </>
        }
        contentContainerStyle={styles.content}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: HEADER_HEIGHT + 20
  },
  titleInstrucao: {
    textAlign: 'justify',
    fontSize: fontSizes.f24,
    marginTop: 17,
    marginBottom: 8,
    lineHeight: 22,
    color: colors.primary,
    fontFamily: 'Nunito_400Regular'
  },
  obsInstrucao: {
    fontSize: fontSizes.f16,
    lineHeight: 24,
    color: colors.primary,
    marginBottom: 30
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 10
  },
  button: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20
  }
})
