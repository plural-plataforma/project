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
import { Camera } from 'phosphor-react-native';

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

// Lista de UFs
const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Mapa de cidades por UF (exemplo simples; expanda conforme necessário)
const cidadesPorUf: { [key: string]: string[] } = {
  SP: ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'],
  // Adicione mais UFs conforme necessário
};


export default function CadastroProfessor() {
  const router = useRouter();
  const [professor, setProfessor] = useState<Professor>({
    nomeCompleto: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    estado: '',
    cidade: '',
    telefone: '',
    disciplinas: '',
    nivelEnsino: '',
    sobre: '',
    isCheckTerms: false,
    escolas: [],
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const cidadesDisponiveis = professor.estado ? cidadesPorUf[professor.estado] || ['Ivoti'] : ['Selecione UF primeiro'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await buscarProfessor();
        const updatedProfessor = {
          ...data.objeto,
          escolas: Array.isArray(data.objeto.escolas) ? data.objeto.escolas : data.objeto.escolas ? [data.objeto.escolas] : [],
        };
        console.log(updatedProfessor)
        setProfessor(updatedProfessor);
      } catch (error) {
        console.error('Erro ao carregar dados do professor:', error);
        Alert.alert('Erro', 'Não foi possível carregar seus dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  

  const handleConcluir = async () => {
    if (!professor.isCheckTerms) {
      Alert.alert(
        'Atenção',
        'Você deve aceitar os Termos de Uso e Política de Privacidade.'
      );
      return;
    }
    if (
      !professor.disciplinas ||
      !professor.escolas ||
      !professor.estado ||
      !professor.cidade ||
      !professor.sobre?.trim()
    ) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios (*).');
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
    } catch (error) {
      console.error('Erro ao atualizar professor:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados.');
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

  const renderErros = () => {
      
    };
  const handleEscolasChange = (text: string) => {
    const escolasArray = text.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
    setProfessor({ ...professor, escolas: escolasArray });
  };

  if (loading) return <ActivityIndicator size="large" color={colors.primary} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Perfil do Professor" onBack={() => router.back()} />

      {/** Progresso */}
      <ProgressFill />
      {/** Explicação quando perfil não estiver completo */}
      <View>
        <Text style={styles.titleInstrucao}>Finalize seu cadastro!</Text>
        <Text style={styles.obsInstrucao}>
          Conclua a configuração do seu perfil para acessar todos os recursos da
          plataforma
        </Text>
      </View>

      {/** Upload Foto */}
      <ProfilePhoto />

      
      {/* Dados Pessoais */}
  <SectionGroup title='Dados Pessoais'>
   
    <InputField label={'Nome'} placeholder={'Digite o nome'}></InputField> 
    
  </SectionGroup>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          value={professor.nomeCompleto || ''}
          onChangeText={(text) =>
            setProfessor({ ...professor, nomeCompleto: text })
          }
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Área de ensino</Text>
        <View style={styles.pickerContainer}>
          <RNPicker
            selectedValue={professor.disciplinas}
            onValueChange={(itemValue) =>
              setProfessor({ ...professor, disciplinas: itemValue })
            }
            style={styles.picker}
            dropdownIconColor="#999"
            mode="dropdown"
          >
            <RNPicker.Item label="Selecione sua área" value="" />
            {areasEnsino.map((area) => (
              <RNPicker.Item key={area} label={area} value={area} />
            ))}
          </RNPicker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Escola/Instituição</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da escola onde leciona"
          value={professor.escolas?.join(', ') || ''}
          onChangeText={handleEscolasChange}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nível de ensino</Text>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('Fundamental I')}
          >
            <View
              style={[
                styles.checkboxBox,
                professor.nivelEnsino?.includes('Fundamental I') &&
                  styles.checkboxChecked,
              ]}
            />
            <Text>Fundamental I</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('Fundamental II')}
          >
            <View
              style={[
                styles.checkboxBox,
                professor.nivelEnsino?.includes('Fundamental II') &&
                  styles.checkboxChecked,
              ]}
            />
            <Text>Fundamental II</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('Ensino Médio')}
          >
            <View
              style={[
                styles.checkboxBox,
                professor.nivelEnsino?.includes('Ensino Médio') &&
                  styles.checkboxChecked,
              ]}
            />
            <Text>Ensino Médio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('EJA')}
          >
            <View
              style={[
                styles.checkboxBox,
                professor.nivelEnsino?.includes('EJA') && styles.checkboxChecked,
              ]}
            />
            <Text>EJA</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Estado</Text>
        <View style={styles.pickerSmallContainer}>
          <RNPicker
            selectedValue={professor.estado}
            onValueChange={(itemValue) =>
              setProfessor({ ...professor, estado: itemValue, cidade: '' })
            }
            style={[styles.pickerSmall, styles.input]}
            itemStyle={styles.pickerItem}
            dropdownIconColor="#999"
            mode="dropdown"
          >
            <RNPicker.Item label="UF" value="" />
            {ufs.map((ufItem) => (
              <RNPicker.Item key={ufItem} label={ufItem} value={ufItem} />
            ))}
          </RNPicker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Cidade</Text>
        <View style={styles.pickerSmallContainer}>
          <RNPicker
            selectedValue={professor.cidade}
            onValueChange={(itemValue) =>
              setProfessor({ ...professor, cidade: itemValue })
            }
            style={[styles.pickerSmall, styles.input]}
            itemStyle={styles.pickerItem}
            dropdownIconColor="#999"
            mode="dropdown"
            enabled={!!professor.estado}
          >
            <RNPicker.Item label="Qual cidade" value="" />
            {cidadesDisponiveis.map((cidadeItem) => (
              <RNPicker.Item
                key={cidadeItem}
                label={cidadeItem}
                value={cidadeItem}
              />
            ))}
          </RNPicker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sobre você</Text>
        <TextInput
          style={[styles.textarea, styles.input]}
          placeholder="Conte um pouco sobre sua experiência e metodologia de ensino."
          multiline
          maxLength={950}
          value={professor.sobre || ''}
          onChangeText={(text) =>
            setProfessor({ ...professor, sobre: text })
          }
          textAlignVertical="top"
        />
        <Text style={styles.contador}>
          {950 - (professor.sobre?.length || 0)} caracteres restantes
        </Text>
      </View>

      <View style={styles.inputGroup}>
       <View style={styles.checkboxRow}>
            <CheckboxWithLabel label="Aceito os termos e a política de privacidade" //checked={credentials.isCheckTerms}
            onPress={() =>{}}/>
      </View>
      </View>
      {renderErros()}
          <View style={styles.button}>
          <CustomButton
            title="Cadastrar"
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
  // ... (mantenha os estilos anteriores)
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    padding: 20
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20
  },
  header: {
    alignItems: 'center'
  },

  progressText: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: 'Nunito_400Regular'
  },
   titleInstrucao: {
    textAlign: 'justify',
    fontSize: fontSizes.f24,
    marginTop:17,
    marginBottom: 8,
    lineHeight: 22,
    color:colors.primary,
    fontFamily: 'Nunito_400Regular'
  },
  obsInstrucao: {
    fontSize: fontSizes.f16,
    lineHeight: 24,
    color:colors.primary,
    marginBottom: 30
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5
  },

  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA'
  },
  // Estilos para Picker
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden' // Para bordas arredondadas no dropdown
  },
  picker: {
    height: 50, // Altura fixa para simular input
    fontSize: 16
  },
  pickerSmallContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden'
  },
  pickerSmall: {
    height: 50,
    fontSize: 16
  },
  pickerItem: {
    fontSize: 16
  },
  checkboxContainer: {
    gap: 10
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 4
  },
  checkboxChecked: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B'
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  inputSmall: {
    flex: 1
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top'
  },
  contador: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  button: {
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold'
  }
})
