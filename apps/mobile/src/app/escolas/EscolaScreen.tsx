import { colors } from "@/packages/ui/theme/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import InputField from "@src/components/InputField";
import { atualizaEscolas, buscarEscolaPorId } from "@src/services/escolasService";
import { fetchEstados, fetchMunicipios } from "@src/services/locationsService";
import { fetchCepData } from "@src/services/validateCep";
import { Escola, TipoEscola } from "@src/types/escolas";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator, Alert } from "react-native";

export default function EscolaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
  const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>({});
  const [escolas, setEscolas] = useState<Escola>({
    id: id ? parseInt(id as string) : 0,
    nomeInstituicao: "",
    tipo: TipoEscola.Publica,
    cep: "",
    logradouro: "",
    numero: 0,
    complemento: "",
    bairro: "",
    estado: "",
    cidade: "",
  });
  const cidadesDisponiveis = escolas.estado
    ? cidadesPorUf[escolas.estado] || ['Selecione o estado primeiro']
    : ['Selecione o estado primeiro'];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.warn('⚠️ Nenhum token encontrado. Usuário não autenticado.');
          Alert.alert('Aviso', 'Por favor, faça login para carregar os dados.');
          return;
        }

        const estadosData = await fetchEstados();
        const formattedUfs = estadosData.map((uf) => ({ label: uf.nome, value: uf.sigla }));
        setUfs(formattedUfs);

        if (id) {
          try {
            const escolaData = await buscarEscolaPorId(parseInt(id as string));
            setEscolas(escolaData);
            if (escolaData.estado && !cidadesPorUf[escolaData.estado]) {
              const municipios = await fetchMunicipios(escolaData.estado);
              const cidades = municipios.map((m) => m.nome);
              setCidadesPorUf((prev) => ({ ...prev, [escolaData.estado]: cidades }));
            }
          } catch (error: any) {
            console.error('❌ Erro ao buscar escola:', error.message);
            Alert.alert('Erro', 'Não foi possível carregar os dados da escola.');
          }
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar dados iniciais:', error.message);
        if (error.message.includes('401')) {
          Alert.alert('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
          router.push('/auth/login');
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os dados. Preencha manualmente.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const handleCepChange = async (text: string) => {
    const cepClean = text.replace(/[^0-9]/g, '');
    setEscolas((prev) => ({ ...prev, cep: cepClean }));

    if (cepClean.length === 8) {
      setCepLoading(true);
      try {
        const cepData = await fetchCepData(cepClean);
        setEscolas((prev) => ({
          ...prev,
          logradouro: cepData.street || '',
          bairro: cepData.neighborhood || '',
          estado: cepData.state || '',
          cidade: cepData.city || '',
        }));

        if (cepData.state && !cidadesPorUf[cepData.state]) {
          const municipiosData = await fetchMunicipios(cepData.state);
          const cidades = municipiosData.map((m) => m.nome);
          setCidadesPorUf((prev) => ({ ...prev, [cepData.state]: cidades }));
        }
      } catch (error: any) {
        console.error('❌ Erro ao buscar CEP:', error);
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
    if (!escolas.nomeInstituicao || !escolas.cep || !escolas.estado || !escolas.cidade) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios (Nome, CEP, Estado, Cidade).');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Erro', 'Usuário não autenticado. Faça login novamente.');
        router.push('/auth/login');
        return;
      }

      const escolaData: Partial<Escola> = {
        id: escolas.id,
        nomeInstituicao: escolas.nomeInstituicao,
        tipo: escolas.tipo,
        cep: escolas.cep,
        logradouro: escolas.logradouro,
        numero: escolas.numero,
        complemento: escolas.complemento,
        bairro: escolas.bairro,
        estado: escolas.estado,
        cidade: escolas.cidade,
      };

      const updatedEscola = await atualizaEscolas(escolaData);
      console.log('✅ Escola salva:', updatedEscola);
      Alert.alert('Sucesso', `Escola ${escolas.id ? 'atualizada' : 'cadastrada'} com sucesso!`);
      router.back();
    } catch (error: any) {
      console.error('❌ Erro ao salvar escola:', error);
      if (error.response?.status === 401) {
        Alert.alert('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
        router.push('/auth/login');
      } else if (error.response?.status === 400) {
        Alert.alert('Erro', 'Dados inválidos. Verifique os campos e tente novamente.');
      } else {
        Alert.alert('Erro', 'Não foi possível salvar a escola. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formSections = [
    {
      id: 'fields',
      fields: [
        {
          id: 'nomeInstituicao',
          label: "Nome da Instituição",
          placeholder: "Digite o nome da instituição",
          value: escolas.nomeInstituicao || '',
          onChangeText: (value: string) => setEscolas((prev) => ({ ...prev, nomeInstituicao: value })),
        },
        {
          id: 'tipo',
          label: "Tipo de Escola",
          placeholder: "Selecione o tipo de escola",
          options: Object.values(TipoEscola).map(t => ({ label: t, value: t })),
          selectedValue: escolas.tipo || TipoEscola.Publica,
          onValueChange: (value: any) => setEscolas((prev) => ({ ...prev, tipo: value as TipoEscola })),
        },
        {
          id: 'cep',
          label: "CEP",
          placeholder: "Informe o CEP",
          value: escolas.cep || '',
          onChangeText: handleCepChange,
          editable: !cepLoading,
          mask: "cep" as const,
        },
        {
          id: 'estado',
          label: "Estado",
          placeholder: "Informe o estado",
          options: ufs,
          selectedValue: escolas.estado || '',
          onValueChange: (value: any) => {
            const stateValue = value?.toString() || '';
            setEscolas((prev) => ({ ...prev, estado: stateValue, cidade: '' }));
            if (stateValue && !cidadesPorUf[stateValue]) {
              fetchMunicipios(stateValue)
                .then((municipiosData) => {
                  const cidades = municipiosData.map((m) => m.nome);
                  setCidadesPorUf((prev) => ({ ...prev, [stateValue]: cidades }));
                })
                .catch((err) => console.error('❌ Erro ao carregar cidades:', err));
            }
          },
        },
        {
          id: 'cidade',
          label: "Cidade",
          placeholder: "Informe a cidade",
          options: cidadesDisponiveis.map((cidade) => ({ label: cidade, value: cidade })),
          selectedValue: escolas.cidade || '',
          onValueChange: (value: any) => {
            const cityValue = value?.toString() || '';
            setEscolas((prev) => ({ ...prev, cidade: cityValue }));
          },
        },
        {
          id: 'bairro',
          label: "Bairro",
          placeholder: "Digite o bairro",
          value: escolas.bairro || '',
          onChangeText: (value: string) => setEscolas((prev) => ({ ...prev, bairro: value })),
        },
        {
          id: 'logradouro',
          label: "Endereço",
          placeholder: "Digite o endereço",
          value: escolas.logradouro || '',
          onChangeText: (value: string) => setEscolas((prev) => ({ ...prev, logradouro: value })),
        },
        {
          id: 'numero',
          label: "Número",
          placeholder: "Digite o número",
          value: escolas.numero ? escolas.numero.toString() : '',
          onChangeText: (value: string) => {
            const numValue = value === '' ? 0 : parseInt(value) || 0;
            setEscolas((prev) => ({ ...prev, numero: numValue }));
          },
          keyboardType: "number-pad" as const,
        },
        {
          id: 'complemento',
          label: "Complemento",
          placeholder: "Digite o complemento",
          value: escolas.complemento || '',
          onChangeText: (value: string) => setEscolas((prev) => ({ ...prev, complemento: value })),
        },
      ]
    }
  ];

  if (loading && !id) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Header title={id ? "Editar Escola" : "Cadastrar Escola"} onBack={() => router.back()} />
      <FlatList
        data={formSections[0].fields}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.inputContainer}>
            <InputField {...item} />
            {item.id === 'cep' && cepLoading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        )}
        contentContainerStyle={styles.content}
        ListFooterComponent={
          <View style={styles.button}>
            <CustomButton
              title="Salvar Cadastro"
              onPress={handleConcluir}
              buttonColor={{ backgroundColor: colors.primary2 }}
              disabled={loading}
              loading={loading}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  button: {
    alignItems: 'center',
    marginTop: 20,
  },
});