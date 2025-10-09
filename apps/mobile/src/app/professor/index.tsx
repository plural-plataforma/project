import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Camera, GraduationCap, User } from 'phosphor-react-native';
import { fetchCepData } from '../../services/validateCep';
import { fetchEstados, fetchMunicipios } from '../../services/locationsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '../../components/Header';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { colors, fontSizes } from '@/packages/ui/theme/theme';
import { Professor } from '@src/types/professor';
import { buscarProfessor, atualizarProfessor } from '../../services/professorService';
import { isCadastroCompleto } from '../../utils/professorUtils';
import ProfilePhoto from '@src/components/ProfilePhoto';
import ProgressFill from '@src/components/ProgressFill';
import { CheckboxWithLabel, InputField } from '@/packages/ui/components';
import CustomButton from '@src/components/CustomButton';
import SectionGroup from '@src/components/SectionGroup';

// Lista de áreas de ensino
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
  'Artes',
];

export default function CadastroProfessor() {
  const router = useRouter();
  const [professor, setProfessor] = useState<Professor>({
    nomeCompleto: '',
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
  const [loading, setLoading] = useState<boolean>(true);
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
  const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>({});
  const cidadesDisponiveis = professor.estado ? cidadesPorUf[professor.estado] || ['Selecione o estado primeiro'] : ['Selecione o estado primeiro'];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.warn('⚠️ Nenhum token encontrado. Usuário não autenticado.');
          Alert.alert('Aviso', 'Por favor, faça login para carregar seus dados.');
          setLoading(false);
          return;
        }

        // Fetch states
        const estadosData = await fetchEstados();
        const formattedUfs = estadosData.map(uf => ({ label: uf.nome, value: uf.sigla }));
        setUfs(formattedUfs);

        // Pre-fetch municipalities for RS as an example
        const municipiosData = await fetchMunicipios('RS');
        const cidadesRS = municipiosData.map(m => m.nome);
        setCidadesPorUf(prev => ({ ...prev, RS: cidadesRS }));

        const data = await buscarProfessor();
        const updatedProfessor = {
          ...data.objeto,
          escolas: Array.isArray(data.objeto.escolas) ? data.objeto.escolas : data.objeto.escolas ? [data.objeto.escolas] : [],
        };
        setProfessor(updatedProfessor);
      } catch (error: any) {
        console.error('Erro ao carregar dados iniciais:', error.message);
        if (error.message.includes('401')) {
          Alert.alert('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
          router.push('/login');
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os dados. Preencha manualmente.');
          setProfessor((prev) => ({
            ...prev,
            estado: 'SP',
            cidade: 'São Paulo',
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleCepChange = async (text: string) => {
    const cepClean = text.replace(/[^0-9]/g, '');
    setProfessor({ ...professor, cep: cepClean });

    if (cepClean.length === 8) {
      setCepLoading(true);
      try {
        const cepData = await fetchCepData(cepClean);
        setProfessor((prev) => ({
          ...prev,
          logradouro: cepData.street || '',
          bairro: cepData.neighborhood || '',
          estado: cepData.state || '',
          cidade: cepData.city || '',
        }));

        // Fetch municipalities for the new state if not already loaded
        if (cepData.state && !cidadesPorUf[cepData.state]) {
          const municipiosData = await fetchMunicipios(cepData.state);
          const cidades = municipiosData.map(m => m.nome);
          setCidadesPorUf(prev => ({ ...prev, [cepData.state]: cidades }));
        }
      } catch (error: any) {
        console.error('Erro ao buscar CEP:', error);
        if (error.name === 'BadRequestError') {
          Alert.alert('Erro de Validação', error.message);
        } else if (error.name === 'NotFoundError') {
          Alert.alert('Erro', 'CEP não encontrado.');
        } else if (error.name === 'InternalError') {
          Alert.alert('Erro', 'Erro interno no serviço de CEP.');
        } else {
          Alert.alert('Erro', error.message || 'Não foi possível buscar o endereço.');
        }
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleConcluir = async () => {
    console.log('Professor state:', professor);
    if (!professor.aceitouTermos) {
      Alert.alert('Atenção', 'Você deve aceitar os Termos de Uso e Política de Privacidade.');
      return;
    }
    if (!professor.estado || !professor.cidade || !professor.cep || professor.cep.length !== 8) {
      console.log('Validation failed for:', {
        estado: professor.estado,
        cidade: professor.cidade,
        cep: professor.cep,
      });
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios (*), incluindo um CEP válido de 8 dígitos.');
      return;
    }

    try {
      setLoading(true);
      await atualizarProfessor(professor);
      if (isCadastroCompleto(professor)) {
        Alert.alert('Sucesso', 'Cadastro concluído com sucesso!');
        router.push('/dashboard');
      } else {
        Alert.alert('Aviso', 'Preencha todos os campos obrigatórios.');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar professor:', error.message);
      if (error.message.includes('401') || error.message.includes('Token de autenticação não encontrado')) {
        Alert.alert('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
        Alert.alert(
          'Sair da conta?',
          'Isso invalidará sua sessão e você precisará fazer login novamente.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Sair',
              onPress: () => {
                console.log('✅ Confirmação de sair aceita!');
                signOut();
              },
            },
          ]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível salvar os dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleNivel = (nivel: string) => {
    setProfessor((prev) => ({
      ...prev,
      nivelEnsino: prev.nivelEnsino
        ? prev.nivelEnsino.includes(nivel)
          ? prev.nivelEnsino.replace(nivel, '').replace(/,\s*$/, '')
          : `${prev.nivelEnsino}, ${nivel}`
        : nivel,
    }));
  };

  const renderErros = () => {};

  const handleEscolasChange = (text: string) => {
    const escolasArray = text.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
    setProfessor({ ...professor, escolas: escolasArray });
  };

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Perfil do Professor" onBack={() => router.back()} />

      <ProgressFill />
      <View>
        <Text style={styles.titleInstrucao}>Finalize seu cadastro!</Text>
        <Text style={styles.obsInstrucao}>
          Conclua a configuração do seu perfil para acessar todos os recursos da plataforma
        </Text>
      </View>

      {/**<ProfilePhoto />*/}

      <SectionGroup title="Dados Pessoais" icon={<User size={16} weight="fill" color={colors.primary} />}>
        <InputField
          label="Nome"
          placeholder="Digite o nome"
          value={professor.nomeCompleto || ''}
          onChangeText={(value) => setProfessor({ ...professor, nomeCompleto: value })}
        />
        <InputField
          label="E-mail"
          placeholder="Digite o e-mail"
          value={professor.email || ''}
          onChangeText={(value) => setProfessor({ ...professor, email: value })}
        />
        <InputField
          label="Telefone"
          placeholder="(00) 00000-0000"
          value={professor.telefone || ''}
          onChangeText={(value) => setProfessor({ ...professor, telefone: value })}
        />
        <InputField
          label="Sexo"
          placeholder="Selecione o sexo"
          options={[
            { label: 'Feminino', value: 'F' },
            { label: 'Masculino', value: 'M' },
          ]}
        />
        <InputField
          label="CEP"
          placeholder="Informe o CEP"
          value={professor.cep || ''}
          onChangeText={handleCepChange}
          editable={!cepLoading}
        />
        {cepLoading && <ActivityIndicator size="small" color={colors.primary} />}
        <InputField
          label="Logradouro"
          placeholder="Digite o logradouro"
          value={professor.logradouro || ''}
          onChangeText={(value) => setProfessor({ ...professor, logradouro: value })}
        />
        <InputField
          label="Número"
          placeholder="Digite o número"
          value={professor.numero ? professor.numero.toString() : ''}
          onChangeText={(value) => {
            const numValue = value === '' ? 0 : parseInt(value) || 0;
            setProfessor({ ...professor, numero: numValue });
          }}
        />
        <InputField
          label="Complemento"
          placeholder="Digite o complemento"
          value={professor.complemento || ''}
          onChangeText={(value) => setProfessor({ ...professor, complemento: value })}
        />
        <InputField
          label="Bairro"
          placeholder="Digite o bairro"
          value={professor.bairro || ''}
          onChangeText={(value) => setProfessor({ ...professor, bairro: value })}
        />
        <InputField
          label="Estado"
          placeholder="Informe o estado"
          options={ufs}
          selectedValue={professor.estado || ''}
          onValueChange={(value) => {
            setProfessor({ ...professor, estado: value, cidade: '' }); // Reset cidade when estado changes
            if (value && !cidadesPorUf[value]) {
              fetchMunicipios(value).then(municipiosData => {
                const cidades = municipiosData.map(m => m.nome);
                setCidadesPorUf(prev => ({ ...prev, [value]: cidades }));
              }).catch(err => console.error('Erro ao carregar cidades:', err));
            }
          }}
        />
        <InputField
          label="Cidade"
          placeholder="Informe a cidade"
          options={cidadesDisponiveis.map((cidade) => ({ label: cidade, value: cidade }))}
          selectedValue={professor.cidade || ''}
          onValueChange={(value) => setProfessor({ ...professor, cidade: value })}
        />
      </SectionGroup>
      <SectionGroup title="Dados Profissionais" icon={<GraduationCap size={16} weight="fill"  color={colors.primary} />}>
      <InputField
          label="Cidade"
          placeholder="Informe a cidade"
          options={cidadesDisponiveis.map((cidade) => ({ label: cidade, value: cidade }))}
          selectedValue={professor.cidade || ''}
          onValueChange={(value) => setProfessor({ ...professor, cidade: value })}
        />
      </SectionGroup>
      <SectionGroup title="Preferências" icon={<Bell size={16} weight="fill"   color={colors.primary} />}>
      
       </SectionGroup>
      <View style={styles.checkboxRow}>
        <CheckboxWithLabel
          label="Aceito os termos e a política de privacidade"
          checked={professor.aceitouTermos}
          onPress={() => setProfessor(prev => ({ ...prev, aceitouTermos: !prev.aceitouTermos }))} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    padding: 20,
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: 'Nunito_400Regular',
  },
  titleInstrucao: {
    textAlign: 'justify',
    fontSize: fontSizes.f24,
    marginTop: 17,
    marginBottom: 8,
    lineHeight: 22,
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
  },
  obsInstrucao: {
    fontSize: fontSizes.f16,
    lineHeight: 24,
    color: colors.primary,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    fontSize: 16,
  },
  pickerSmallContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  pickerSmall: {
    height: 50,
    fontSize: 16,
  },
  pickerItem: {
    fontSize: 16,
  },
  checkboxContainer: {
    gap: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputSmall: {
    flex: 1,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  contador: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  button: {
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
});

function signOut() {
  throw new Error('Function not implemented.');
}