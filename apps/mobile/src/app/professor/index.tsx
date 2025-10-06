import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Switch,
  Dimensions
} from 'react-native'
import { useRouter } from 'expo-router'
import { Camera } from 'phosphor-react-native' // Removido UploadSimple se não usado
import * as ImagePicker from 'expo-image-picker'
import Header from '../../components/Header'
import { Picker as RNPicker } from '@react-native-picker/picker' // Alias para evitar conflito
import { colors } from '@/packages/ui/theme/theme'

const { width } = Dimensions.get('window')
const screenWidth = width - 40 // Padding lateral

export default function CadastroProfessor() {
  const router = useRouter()
  const [fotoUri, setFotoUri] = useState<string | null>(null)
  const [areaEnsino, setAreaEnsino] = useState('')
  const [niveisEnsino, setNiveisEnsino] = useState({
    fundamentalI: false,
    fundamentalII: false,
    medio: false,
    eja: false
  })
  const [nomeEscola, setNomeEscola] = useState('')
  const [uf, setUf] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [sobreVoce, setSobreVoce] = useState('')
  const [aceitaTermos, setAceitaTermos] = useState(false)
  const [caracteresRestantes, setCaracteresRestantes] = useState(950)
  const [nomeProfessor, setNomeProfessor] = useState('')

  // Lista de áreas de ensino (exemplo; ajuste com dados reais)
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

  // Lista de UFs
  const ufs = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO'
  ]

  // Mapa de estados para UFs (para seleção)
  const estadosPorUf: { [key: string]: string } = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins'
  }

  // Lista de cidades filtrada por UF (exemplo simples; use API para real)
  const cidadesPorUf: { [key: string]: string[] } = {
    SP: ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
    RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
    MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora']
    // Adicione mais UFs conforme necessário
    // Default para outros
  }
  const cidadesDisponiveis = cidadesPorUf[uf] || ['Selecione UF primeiro']

  // Função para selecionar foto
  const selecionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permissão negada',
        'Precisamos de acesso à galeria para foto.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    })

    if (!result.canceled) {
      setFotoUri(result.assets[0].uri)
    }
  }

  // Função para contar caracteres
  const handleSobreVoceChange = (text: string) => {
    if (text.length <= 950) {
      setSobreVoce(text)
      setCaracteresRestantes(950 - text.length)
    }
  }

  // Função para submeter form (ajuste validação para combos)
  const handleConcluir = () => {
    if (!aceitaTermos) {
      Alert.alert(
        'Atenção',
        'Você deve aceitar os Termos de Uso e Política de Privacidade.'
      )
      return
    }
    if (
      !areaEnsino ||
      Object.values(niveisEnsino).some(Boolean) === false || // Pelo menos um nível selecionado
      !nomeEscola ||
      !uf ||
      !cidade ||
      !estado ||
      !sobreVoce.trim()
    ) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios (*).')
      return
    }
    // Chame service/hook aqui
    Alert.alert('Sucesso', 'Cadastro concluído! Redirecionando...')
    router.push('/dashboard')
  }

  // Toggle para checkboxes de nível
  const toggleNivel = (nivel: keyof typeof niveisEnsino) => {
    setNiveisEnsino(prev => ({ ...prev, [nivel]: !prev[nivel] }))
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Header title="Cadastro" onBack={() => router.back()} />

      {/* Header com progresso */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <Text style={styles.progressText}>Progresso</Text>
            <Text style={styles.progressLabel}>3 de 4</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      {/* Instrução */}
      <View>
        <Text style={styles.titleInstrucao}>Finalize seu cadastro!</Text>
        <Text style={styles.obsInstrucao}>
          Conclua a configuração do seu perfil para acessar todos os recursos da
          plataforma
        </Text>
      </View>

      {/* Foto */}
      <TouchableOpacity style={styles.fotoContainer} onPress={selecionarFoto}>
        <View style={styles.fotoCircle}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.fotoImage} />
          ) : (
            <Camera size={40} color="#999" />
          )}
        </View>
        <Text style={styles.fotoLabel}>Escolher foto</Text>
      </TouchableOpacity>

      {/* Escola */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          value={nomeProfessor}
          onChangeText={setNomeProfessor}
        />
      </View>
      {/* Área de ensino - Picker */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Área de ensino</Text>
        <View style={styles.pickerContainer}>
          <RNPicker
            selectedValue={areaEnsino}
            onValueChange={itemValue => setAreaEnsino(itemValue)}
            style={styles.picker}
            dropdownIconColor="#999"
            mode="dropdown" // Para iOS/Android dropdown
          >
            <RNPicker.Item label="Selecione sua área" value="" />
            {areasEnsino.map(area => (
              <RNPicker.Item key={area} label={area} value={area} />
            ))}
          </RNPicker>
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da escola onde leciona"
          value={nomeEscola}
          onChangeText={setNomeEscola}
        />
      </View>

      {/* Nível de ensino - Checkboxes (já ok) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nível de ensino</Text>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('fundamentalI')}
          >
            <View
              style={[
                styles.checkboxBox,
                niveisEnsino.fundamentalI && styles.checkboxChecked
              ]}
            />
            <Text>Fundamental I</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('fundamentalII')}
          >
            <View
              style={[
                styles.checkboxBox,
                niveisEnsino.fundamentalII && styles.checkboxChecked
              ]}
            />
            <Text>Fundamental II</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('medio')}
          >
            <View
              style={[
                styles.checkboxBox,
                niveisEnsino.medio && styles.checkboxChecked
              ]}
            />
            <Text>Ensino Médio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleNivel('eja')}
          >
            <View
              style={[
                styles.checkboxBox,
                niveisEnsino.eja && styles.checkboxChecked
              ]}
            />
            <Text>EJA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Escola */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Escola/Instituição</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da escola onde leciona"
          value={nomeEscola}
          onChangeText={setNomeEscola}
        />
      </View>

      {/* UF */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Estado</Text>

        <View style={styles.row}>
          {/* Estado */}
          <View style={styles.pickerSmallContainer}>
            <RNPicker
              selectedValue={uf}
              onValueChange={itemValue => {
                setUf(itemValue)
                setCidade('') // Reset cidade ao mudar UF
              }}
              style={[styles.pickerSmall, styles.input]}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#999"
              mode="dropdown"
            >
              <RNPicker.Item label="UF" value="" />
              {ufs.map(ufItem => (
                <RNPicker.Item key={ufItem} label={ufItem} value={ufItem} />
              ))}
            </RNPicker>
          </View>
        </View>
        {/* Cidade */}
        <Text style={styles.label}>Cidade</Text>
        <View style={styles.pickerSmallContainer}>
          <RNPicker
            selectedValue={cidade}
            onValueChange={itemValue => setCidade(itemValue)}
            style={[styles.pickerSmall, styles.input]}
            itemStyle={styles.pickerItem}
            dropdownIconColor="#999"
            mode="dropdown"
            enabled={!!uf} // Desabilita se UF não selecionado
          >
            <RNPicker.Item label="Sua cidade" value="" />
            {cidadesDisponiveis.map(cidadeItem => (
              <RNPicker.Item
                key={cidadeItem}
                label={cidadeItem}
                value={cidadeItem}
              />
            ))}
          </RNPicker>
        </View>
      </View>

      {/* Sobre você */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sobre você</Text>
        <TextInput
          style={[styles.textarea, styles.input]}
          placeholder="Conte um pouco sobre sua experiência e metodologia de ensino."
          multiline
          maxLength={950}
          value={sobreVoce}
          onChangeText={handleSobreVoceChange}
          textAlignVertical="top"
        />
        <Text style={styles.contador}>
          {caracteresRestantes} caracteres restantes
        </Text>
      </View>

      {/* Termos */}
      <View style={styles.inputGroup}>
        <View style={styles.checkboxRow}>
          <Switch value={aceitaTermos} onValueChange={setAceitaTermos} />
          <Text style={styles.checkboxLabel}>
            Aceito os Termos de Uso e Política de Privacidade da plataforma
          </Text>
        </View>
      </View>

      {/* Botão */}
      <TouchableOpacity style={styles.button} onPress={handleConcluir}>
        <Text style={styles.buttonText}>Concluir Cadastro</Text>
      </TouchableOpacity>
    </ScrollView>
  )
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
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  header: {
    alignItems: 'center'
  },
  progressContainer: {
    alignItems: 'center',
    width: screenWidth,
    padding: 20
  },
  progressText: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: 'Nunito_400Regular'
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: screenWidth,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    width: '75%' // 3 de 4
  },
  progressLabel: {
    fontSize: 14,
    marginTop: 5,
    color: '#666'
  },
  titleInstrucao: {
    textAlign: 'justify',
    fontSize: 24,
    marginBottom: 30,
    lineHeight: 22,
    fontFamily: 'Nunito_400Regular'
  },
  obsInstrucao: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 30
  },
  fotoContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  fotoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  fotoImage: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  fotoLabel: {
    color: '#F59E0B',
    fontWeight: '500'
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
    backgroundColor: colors.tertiary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold'
  }
})
