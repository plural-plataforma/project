import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Camera, GraduationCap, User, Trash } from 'phosphor-react-native';
import { fetchCepData } from '../../services/validateCep';
import { fetchEstados, fetchMunicipios } from '../../services/locationsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarEscolas } from '../../services/escolasService';
import Header from '../../components/Header';
import { colors, fontSizes } from '@/packages/ui/theme/theme';
import { Professor } from '@src/types/professor';
import { Escola } from '@src/types/escolas';
import { buscarProfessor, atualizarProfessor, vincularEscola, buscarEscolasProfessor, atualizarEscolasProfessor } from '../../services/professorService';
import { isCadastroCompleto } from '../../utils/professorUtils';
import ProfilePhoto from '@src/components/ProfilePhoto';
import ProgressFill from '@src/components/ProgressFill';
import { CheckboxWithLabel, InputField } from '@/packages/ui/components';
import CustomButton from '@src/components/CustomButton';
import SectionGroup from '@src/components/SectionGroup';
import ItemButton from '@src/components/ItemButton';
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';

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
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
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
  const [initialEscolas, setInitialEscolas] = useState<string[]>([]) // NOVO: Armazena escolas iniciais para calcular diff
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

  // Novo: Função para obter erro de um campo (síncrona)
  const getFieldError = (key: keyof Professor, value: any): string | null => {
    switch (key) {
      case 'nomeCompleto':
        return !value || (value as string).trim().length < 2
          ? 'Nome deve ter pelo menos 2 caracteres'
          : null
      case 'email':
        return !value || !/^\S+@\S+\.\S+$/.test(value as string)
          ? 'E-mail inválido'
          : null
      case 'telefone':
        return !value || (value as string).replace(/\D/g, '').length < 10
          ? 'Telefone inválido'
          : null
      case 'sexo':
        return !value ? 'Selecione o sexo' : null
      case 'cep':
        return !value || (value as string).trim() === ''
          ? 'CEP é obrigatório'
          : null
      case 'logradouro':
        return !value || (value as string).trim() === ''
          ? 'Endereço é obrigatório'
          : null
      case 'numero':
        return !value || value === 0 ? 'Número é obrigatório' : null
      case 'bairro':
        return !value || (value as string).trim() === ''
          ? 'Bairro é obrigatório'
          : null
      case 'estado':
        return !value || (value as string).trim() === ''
          ? 'Estado é obrigatório'
          : null
      case 'cidade':
        return !value || (value as string).trim() === ''
          ? 'Cidade é obrigatória'
          : null
      case 'escolas':
        return (value as string[])?.length === 0
          ? 'Vincule pelo menos uma escola'
          : null
      case 'aceitouTermos':
        return !value ? 'Aceite os termos e a política de privacidade' : null
      default:
        return null
    }
  }

  // Novo: Função para validar campo e atualizar erros (usa getFieldError)
  const validateField = (
    key: keyof Professor,
    value: any
  ) => {
    const errorMsg = getFieldError(key, value)
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors }
      if (errorMsg) {
        newErrors[key as string] = errorMsg
      } else {
        delete newErrors[key as string]
      }
      return newErrors
    })
  }

  // Novo: Função para validar todos os campos obrigatórios
  const validateAllFields = () => {
    const requiredFields = [
      'nomeCompleto',
      'email',
      'telefone',
      'sexo',
      'cep',
      'logradouro',
      'numero',
      'bairro',
      'estado',
      'cidade',
      'escolas',
      'aceitouTermos'
    ] as (keyof Professor)[];
    requiredFields.forEach(key => {
      validateField(key, professor[key]);
    });
  };

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

        const escolasData = await buscarEscolas();
        if (!escolasData.length) {
          showAlert(
            'Aviso',
            'Nenhuma escola encontrada. Verifique sua conexão ou tente novamente.'
          )
        }
        setEscolas(escolasData)

        const professorData = await buscarProfessor();
        let updatedProfessor: Professor = {
          ...professorData.objeto,
          sexo: professorData.objeto.sexo && ['F', 'M'].includes(professorData.objeto.sexo) ? professorData.objeto.sexo : '',
          escolas: [] as string[],
        };

        let initialEscolasIds: string[] = []; // NOVO: Calcula aqui

        try {
          const linkedEscolas = await buscarEscolasProfessor();
          initialEscolasIds = linkedEscolas.map(escola => escola.id!.toString());
          updatedProfessor.escolas = initialEscolasIds;
          setInitialEscolas(initialEscolasIds); // NOVO: Define as iniciais
        } catch (error: any) {
          console.warn('⚠️ Falha ao buscar escolas vinculadas:', error.message);
          showAlert('Aviso', 'Não foi possível carregar as escolas vinculadas. Você pode vincular escolas manualmente.');
          setInitialEscolas([]); // NOVO: Inicial vazio se erro
        }

        setProfessor(updatedProfessor);
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
          setInitialEscolas([]); // NOVO: Inicial vazio em erro geral
        }
      } finally {
        setLoading(false)
        setEscolasLoading(false)
      }
    }
    fetchInitialData()
  }, [])

  // Novo: Valida todos os campos após carregar os dados iniciais
  useEffect(() => {
    if (!loading) {
      validateAllFields();
    }
  }, [loading]);

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

        // NOVO: Valida os novos valores preenchidos pelo CEP
        validateField('logradouro', cepData.street);
        validateField('bairro', cepData.neighborhood);
        validateField('estado', cepData.state);
        validateField('cidade', cepData.city);

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
    // FIX: Validação completa síncrona usando getFieldError para erros específicos e destaque visual
    validateAllFields();

    // Verifica se ainda há erros após validação específica
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      showAlert(
        'Aviso',
        'Você precisa completar o cadastro. Corrija os campos destacados em vermelho.'
      );
      return;
    }

    setLoading(true)
    try {
      // FIX: Mudei de undefined para [] para satisfazer o tipo Professor (string[] | never)
      // O service já ignora escolas no payload, então [] é seguro e tipado corretamente
      const professorWithoutSchools = { ...professor, escolas: [] };
      await atualizarProfessor(professorWithoutSchools);

      // NOVO: Calcula diferenças para escolas (apenas adições/remoções)
      const currentEscolasIds = professor.escolas || [];
      const added = currentEscolasIds.filter(id => !initialEscolas.includes(id));
      const removed = initialEscolas.filter(id => !currentEscolasIds.includes(id));

      let schoolsUpdated = true;
      if (added.length > 0 || removed.length > 0) {
        const payload = {
          acoes: [
            ...added.map(id => ({ tipo: 'adicionar' as const, escolaId: parseInt(id) })),
            ...removed.map(id => ({ tipo: 'remover' as const, escolaId: parseInt(id) }))
          ]
        };

        try {
          await atualizarEscolasProfessor(payload);
        } catch (schoolErr: any) {
          console.error('❌ Erro ao atualizar escolas:', schoolErr);
          schoolsUpdated = false;
        }
      }

      // NOVO: Atualiza initialEscolas para o estado atual (para futuras edições, se necessário)
      setInitialEscolas(currentEscolasIds);

      showAlert('Sucesso',
        schoolsUpdated
          ? 'Cadastro de professor salvo com sucesso!'
          : 'Cadastro salvo, mas não foi possível atualizar as escolas vinculadas.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Erro ao salvar professor:', error)
      if (error.message?.includes('401')) {
        showAlert(
          'Erro de Autenticação',
          'Sua sessão expirou. Faça login novamente.'
        )
        router.push('/auth/login')
      } else if ((error as any).response?.status === 400) {
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
      const newEscolas = [...(professor.escolas || []), value]
      setProfessor(prev => ({
        ...prev,
        escolas: newEscolas
      }))
      validateField('escolas', newEscolas) // FIX: Valida com o novo array
    } else if (value && typeof value === 'string') {
      // NOVO: Se já existe, mostra alert
      const escola = escolas.find(e => e.id!.toString() === value);
      const nomeEscola = escola ? escola.nomeInstituicao : value;
      showAlert('Aviso', `A escola "${nomeEscola}" já está vinculada.`);
    }
  }

  const removeEscola = (escolaToRemove: string) => {
    const newEscolas = (professor.escolas || []).filter(escola => escola !== escolaToRemove)
    setProfessor(prev => ({
      ...prev,
      escolas: newEscolas
    }))
    validateField('escolas', newEscolas) // FIX: Valida com o novo array
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
              validateField('cidade', '') // FIX: Valida cidade ao limpar
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
              placeholder={escolasLoading ? 'Carregando escolas...' : 'Informe a escola/instituição'}
              options={escolasLoading || !escolas
                ? []
                : escolas
                  .filter((escola) => escola.nomeInstituicao && escola.id)
                  .map((escola) => ({
                    label: escola.nomeInstituicao!,
                    value: escola.id!.toString(),
                  }))}
              selectedValue=""
              onValueChange={value => {
                if (value && typeof value === 'string') {
                  addEscola(value)
                }
              }}
              editable={!escolasLoading}
              error={error} // Novo: passa erro para InputField
            />
            <CustomButton
              title="Criar minha escola"
              onPress={() => router.push('/escolas/EscolaScreen')}
              buttonColor={{ backgroundColor: colors.primary }}
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
                : professor[field.key] as string || ''
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
              ? (value) => {
                const sexoValue = typeof value === 'string' ? value : '';
                setProfessor({ ...professor, sexo: sexoValue });
                validateField('sexo', sexoValue); // Valida em tempo real
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
          placeholder: escolasLoading ? 'Carregando escolas...' : 'Informe a escola/instituição',
          options: escolasLoading || !escolas
            ? []
            : escolas
              .filter((escola) => escola.nomeInstituicao && escola.id)
              .map((escola) => ({
                label: escola.nomeInstituicao!,
                value: escola.id!.toString(),
              })),
          editable: !escolasLoading,
        },

      ],
      extraContent: null
    },
    {
      id: 'preferencias',
      title: 'Preferências',
      icon: <Bell size={16} weight="fill" color={colors.primary} />,
      extraContent: (
        <View style={styles.preferenciasContent}>
          <TouchableOpacity
            style={styles.trocarSenhaButton}
            onPress={() => router.push('/auth/changePassword')} // Ajuste a rota conforme sua estrutura
          >
            <Text style={styles.trocarSenhaText}>Trocar senha</Text>
          </TouchableOpacity>
        </View>
      )
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
        ref={flatListRef}
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
                <View style={{ padding: 20 }}>
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
                onPress={() => {
                  const newValue = !professor.aceitouTermos
                  setProfessor(prev => ({
                    ...prev,
                    aceitouTermos: newValue
                  }))
                  validateField('aceitouTermos', newValue)
                }}
              />
              {errors['aceitouTermos'] && (
                <Text style={styles.errorText}>{errors['aceitouTermos']}</Text>
              )}
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
  },
  errorText: {
    color: 'red',
    fontSize: fontSizes.f12,
    marginTop: 4,
    marginLeft: 16,
    fontFamily: 'Nunito_400Regular'
  },
  preferenciasContent: {
    marginTop: 8,
  },
  trocarSenhaButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  trocarSenhaText: {
    color: '#fff',
    fontSize: fontSizes.f16,
    fontFamily: 'Nunito_700Bold',
  }
})