import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, GraduationCap, User } from 'phosphor-react-native';
import { fetchCepData } from '../../services/validateCep';
import { fetchEstados, fetchMunicipios } from '../../services/locationsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buscarEscolas } from '../../services/escolasService';
import Header from '../../components/Header';
import { colors, fontSizes } from '@/packages/ui/theme/theme';
import { Professor } from '@src/types/professor';
import { Escola } from '@src/types/escolas';
import {
  buscarProfessor,
  atualizarProfessor,
  buscarEscolasProfessor,
} from '../../services/professorService';
import { isCadastroCompleto } from '../../utils/professorUtils';
import ProgressFill from '@src/components/ProgressFill';
import { CheckboxWithLabel, InputField } from '@/packages/ui/components';
import CustomButton from '@src/components/CustomButton';
import SectionGroup from '@src/components/SectionGroup';
import ItemButton from '@src/components/ItemButton';
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';

import {
  getSiglaFromNome,
  findCidadeMatch,
  formatUfsDropdown,
  formatCidadesList,
} from '@src/utils/locationUtils';

const HEADER_HEIGHT = 55;

const sexoOptions = [
  { label: 'Feminino', value: 'F' },
  { label: 'Masculino', value: 'M' },
];

type InputFieldConfig =
  | {
    type: 'text';
    label: string;
    key: keyof Professor;
    placeholder?: string;
    mask?: 'cep' | 'phone' | 'cpf';
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'number-pad';
    error?: string;
    editable?: boolean;
  }
  | {
    type: 'dropdown';
    label: string;
    key: keyof Professor;
    placeholder?: string;
    options: { label: string; value: string | number }[];
    selectedValue: string | number | null;
    onValueChange: (value: string | number | null) => void;
    error?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    editable?: boolean;
  };

interface SectionData {
  id: string;
  title: string;
  icon: React.ReactNode;
  fields?: InputFieldConfig[];
  extraContent?: React.ReactNode;
}

export default function CadastroProfessor() {
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();
  const router = useRouter();

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
    escolas: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
  const [cidadesPorUf, setCidadesPorUf] = useState<Record<string, string[]>>({});
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolasLoading, setEscolasLoading] = useState(false);
  const [completedSections, setCompletedSections] = useState(0);
  const totalSections = 4;

  // === Cidades disponíveis com memo ===
  const cidadesDisponiveis = useMemo(() => {
    if (!professor.estado) return ['Selecione o estado primeiro'];
    return cidadesPorUf[professor.estado] || ['Carregando cidades...'];
  }, [professor.estado, cidadesPorUf]);

  // === Progresso do cadastro ===
  useEffect(() => {
    let completed = 0;
    if (professor.nomeCompleto && professor.sexo && professor.email && professor.telefone) completed++;
    if (professor.escolas.length > 0) completed++;
    if (true) completed++; // Preferências (sempre completo)
    if (professor.aceitouTermos) completed++;
    setCompletedSections(completed);
  }, [professor]);

  // === Carregamento inicial ===
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setEscolasLoading(true);

        const token = await AsyncStorage.getItem('authToken');
        if (!token) throw new Error('Token não encontrado');

        // Estados
        const estadosData = await fetchEstados();
        setUfs(formatUfsDropdown(estadosData));

        // Escolas
        const escolasData = await buscarEscolas();
        setEscolas(escolasData || []);

        // Dados do professor
        const professorData = await buscarProfessor();
        const linkedEscolas = await buscarEscolasProfessor().catch(() => []);

        setProfessor({
          ...professorData.objeto,
          sexo: professorData.objeto.sexo && ['F', 'M'].includes(professorData.objeto.sexo)
            ? professorData.objeto.sexo
            : '',
          escolas: linkedEscolas.map(e => e.id!.toString()),
        });
      } catch (err: any) {
        showAlert('Erro', err.message || 'Falha ao carregar dados.');
      } finally {
        setLoading(false);
        setEscolasLoading(false);
      }
    };

    loadData();
  }, []);

  // === Validação em tempo real ===
  const validateField = (key: keyof Professor, value: any) => {
    const newErrors = { ...errors };
    delete newErrors[key as string];

    switch (key) {
      case 'nomeCompleto':
        if (!value || value.trim().length < 2) newErrors[key] = 'Nome muito curto';
        break;
      case 'email':
        if (!/^\S+@\S+\.\S+$/.test(value)) newErrors[key] = 'E-mail inválido';
        break;
      case 'telefone':
        if (value.replace(/\D/g, '').length < 10) newErrors[key] = 'Telefone inválido';
        break;
      case 'sexo':
        if (!value) newErrors[key] = 'Selecione o sexo';
        break;
      case 'escolas':
        if (professor.escolas.length === 0) newErrors[key] = 'Vincule pelo menos uma escola';
        break;
    }

    setErrors(newErrors);
  };

  // === CEP ===
  const handleCepChange = async (text: string) => {
    const cepClean = text.replace(/\D/g, '');
    setProfessor(prev => ({ ...prev, cep: cepClean }));

    if (cepClean.length === 8) {
      setCepLoading(true);
      try {
        const data = await fetchCepData(cepClean);
        const sigla = data.state || getSiglaFromNome(data.state || '');
        const cidadeNome = data.city || '';

        const updates: Partial<Professor> = {
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
        };

        if (sigla) {
          updates.estado = sigla;
          if (!cidadesPorUf[sigla]) {
            const municipios = await fetchMunicipios(sigla);
            const cidades = formatCidadesList(municipios);
            setCidadesPorUf(prev => ({ ...prev, [sigla]: cidades }));
          }
          const matched = findCidadeMatch(cidadeNome, cidadesPorUf[sigla] || []);
          updates.cidade = matched || cidadeNome;
        }

        setProfessor(prev => ({ ...prev, ...updates }));
      } catch (err: any) {
        showAlert('CEP', err.message || 'CEP não encontrado');
      } finally {
        setCepLoading(false);
      }
    }
  };

  // === Estado change ===
  const handleEstadoChange = async (value: string | number | null) => {
    const sigla = value?.toString() || '';
    setProfessor(prev => ({ ...prev, estado: sigla, cidade: '' }));

    if (sigla && !cidadesPorUf[sigla]) {
      const municipios = await fetchMunicipios(sigla);
      const cidades = formatCidadesList(municipios);
      setCidadesPorUf(prev => ({ ...prev, [sigla]: cidades }));
    }
  };

  // === Vincular escola ===
  const addEscola = (id: string) => {
    if (id && !professor.escolas.includes(id)) {
      setProfessor(prev => ({ ...prev, escolas: [...prev.escolas, id] }));
      validateField('escolas', null);
    }
  };

  const removeEscola = (id: string) => {
    setProfessor(prev => ({ ...prev, escolas: prev.escolas.filter(e => e !== id) }));
    validateField('escolas', null);
  };

  // === Salvar ===
  const handleConcluir = async () => {
    if (Object.keys(errors).length > 0 || professor.escolas.length === 0) {
      showAlert('Erro', 'Corrija os campos destacados e vincule uma escola.');
      return;
    }

    setLoading(true);
    try {
      await atualizarProfessor(professor);
      showAlert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      showAlert('Erro', err.message || 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  };

  // === Renderização dos campos ===
  const renderField = (field: InputFieldConfig) => {
    const error = errors[field.key as string];

    if (field.type === 'dropdown') {
      return (
        <InputField
          key={field.key}
          label={field.label}
          placeholder={field.placeholder}
          options={field.options}
          selectedValue={field.selectedValue}
          onValueChange={field.onValueChange}
          searchable={field.searchable}
          searchPlaceholder={field.searchPlaceholder}
          error={error}
          editable={field.editable}
        />
      );
    }

    // Text fields
    return (
      <InputField
        key={field.key}
        label={field.label}
        placeholder={field.placeholder}
        value={
          field.key === 'numero'
            ? professor[field.key]?.toString() || ''
            : (professor[field.key] as string) || ''
        }
        onChangeText={(text) => {
          if (field.key === 'cep') {
            handleCepChange(text);
          } else if (field.key === 'numero') {
            setProfessor(prev => ({ ...prev, numero: parseInt(text) || 0 }));
          } else {
            setProfessor(prev => ({ ...prev, [field.key]: text }));
          }
          validateField(field.key, text);
        }}
        mask={field.mask}
        keyboardType={field.keyboardType}
        error={error}
        editable={field.key === 'cep' ? !cepLoading : field.editable}
      />
    );
  };

  const sections: SectionData[] = [
    {
      id: 'dados-pessoais',
      title: 'Dados Pessoais',
      icon: <User size={16} weight="fill" color={colors.primary} />,
      fields: [
        { type: 'text', label: 'Nome', key: 'nomeCompleto', placeholder: 'Digite o nome' },
        { type: 'text', label: 'E-mail', key: 'email', placeholder: 'seu@email.com', keyboardType: 'email-address' },
        { type: 'text', label: 'Telefone', key: 'telefone', placeholder: '(00) 00000-0000', mask: 'phone' },
        { type: 'dropdown', label: 'Sexo', key: 'sexo', placeholder: 'Selecione', options: sexoOptions, selectedValue: professor.sexo || null, onValueChange: v => setProfessor(p => ({ ...p, sexo: v?.toString() || '' })) },
        { type: 'text', label: 'CEP', key: 'cep', placeholder: '00000-000', mask: 'cep' },
        { type: 'dropdown', label: 'Estado', key: 'estado', placeholder: 'Selecione', options: ufs, selectedValue: professor.estado || null, onValueChange: handleEstadoChange, searchable: true },
        { type: 'dropdown', label: 'Cidade', key: 'cidade', placeholder: 'Selecione', options: cidadesDisponiveis.map(c => ({ label: c, value: c })), selectedValue: professor.cidade || null, onValueChange: v => setProfessor(p => ({ ...p, cidade: v?.toString() || '' })), searchable: true },
        { type: 'text', label: 'Bairro', key: 'bairro', placeholder: 'Digite o bairro' },
        { type: 'text', label: 'Endereço', key: 'logradouro', placeholder: 'Rua, avenida...' },
        { type: 'text', label: 'Número', key: 'numero', placeholder: '000', keyboardType: 'number-pad' },
        { type: 'text', label: 'Complemento', key: 'complemento', placeholder: 'Apt, bloco...' },
        { type: 'text', label: 'Sobre você', key: 'sobre', placeholder: 'Fale sobre sua experiência...' },
      ],
    },
    {
      id: 'dados-profissionais',
      title: 'Dados Profissionais',
      icon: <GraduationCap size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          type: 'dropdown',
          label: 'Escola/Instituição vinculada',
          key: 'escolas',
          placeholder: escolasLoading ? 'Carregando...' : 'Selecione uma escola',
          options: escolas.map(e => ({ label: e.nomeInstituicao!, value: e.id!.toString() })),
          selectedValue: null,
          onValueChange: (v) => v && addEscola(v.toString()),
          error: errors.escolas,
          editable: !escolasLoading,
        } as InputFieldConfig,
      ],
      extraContent: (
        <View style={{ marginTop: 10 }}>
          <CustomButton title="Criar minha escola" onPress={() => router.push('/escolas/EscolaScreen')} buttonColor={{ backgroundColor: colors.primary }} />
          {professor.escolas.map(id => {
            const escola = escolas.find(e => e.id!.toString() === id);
            return <ItemButton key={id} escola={escola?.nomeInstituicao || id} onRemove={() => removeEscola(id)} />;
          })}
        </View>
      ),
    },
    {
      id: 'preferencias',
      title: 'Preferências',
      icon: <Bell size={16} weight="fill" color={colors.primary} />,
      fields: [],
    },
  ];

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <View style={styles.container}>
      <Header title="Perfil do Professor" onBack={() => router.back()} fixed />
      <FlatList
        data={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SectionGroup title={item.title} icon={item.icon}>
            {item.fields?.map(renderField)}
            {item.extraContent}
          </SectionGroup>
        )}
        ListHeaderComponent={
          !isCadastroCompleto(professor) ? (
            <>
              <ProgressFill completedSections={completedSections} totalSections={totalSections} />
              <Text style={styles.titleInstrucao}>Finalize seu cadastro!</Text>
              <Text style={styles.obsInstrucao}>
                Seu cadastro não está completo. Conclua a configuração do seu perfil para acessar todos os recursos da plataforma.
              </Text>
            </>
          ) : null
        }
        ListFooterComponent={
          <>
            <View style={styles.checkboxRow}>
              <CheckboxWithLabel
                label="Aceito os termos e a política de privacidade"
                checked={professor.aceitouTermos}
                onPress={() => setProfessor(p => ({ ...p, aceitouTermos: !p.aceitouTermos }))}
              />
            </View>
            <View style={styles.button}>
              <CustomButton title="Concluir Cadastro" onPress={handleConcluir} buttonColor={{ backgroundColor: colors.primary2 }} loading={loading} />
            </View>
          </>
        }
        contentContainerStyle={styles.content}
      />
      <CustomAlert visible={visible} title={config.title} message={config.message} buttons={config.buttons} onDismiss={handleDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: HEADER_HEIGHT + 20 },
  titleInstrucao: { fontSize: fontSizes.f24, color: colors.primary, textAlign: 'center', marginVertical: 10 },
  obsInstrucao: { fontSize: fontSizes.f16, color: colors.primary, textAlign: 'center', marginBottom: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 15 },
  button: { alignItems: 'center', marginVertical: 20 },
});