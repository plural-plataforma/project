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
import { useCallback, useEffect, useMemo, useState } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator, Keyboard } from "react-native";
// FIX: Importe CustomAlert também
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';

export default function EscolaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
  const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>({});
  const [ufsLoaded, setUfsLoaded] = useState<boolean>(false);
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
  const cidadesDisponiveis = useMemo(() => 
    escolas.estado
      ? cidadesPorUf[escolas.estado] || [escolas.cidade || 'Selecione o estado primeiro']
      : ['Selecione o estado primeiro'],
    [escolas.estado, cidadesPorUf, escolas.cidade]
  );

  const updateEscolas = useCallback((updates: Partial<Escola>) => {
    setEscolas(prev => ({ ...prev, ...updates }));
  }, []);

  // Função para mapear nome completo do estado para sigla (caso o CEP retorne nome)
  const getSiglaFromNome = useCallback((nomeEstado: string): string => {
    const normalizedNome = nomeEstado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const uf = ufs.find(ufItem => 
      ufItem.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedNome
    );
    return uf ? uf.value : '';
  }, [ufs]);

  // Função para normalizar e encontrar cidade exata na lista
  const findMatchingCidade = useCallback((nomeCidade: string, cidadesList: string[]): string | null => {
    if (!nomeCidade || !cidadesList.length) return null;
    const normalizedInput = nomeCidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const match = cidadesList.find(cidade => 
      cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedInput
    );
    return match || null;
  }, []);

  // FIX: Destruture todos os valores necessários para renderizar o alerta
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();

  // Função para carregar estados
  const loadEstados = useCallback(async () => {
    if (ufsLoaded) return;
    try {
      const estadosData = await fetchEstados();
      const formattedUfs = estadosData.map((uf) => ({ label: uf.nome, value: uf.sigla }));
      setUfs(formattedUfs);
      setUfsLoaded(true);
    } catch (error: any) {
      console.error('❌ Erro ao carregar estados:', error.message);
      showAlert('Erro', 'Não foi possível carregar os estados. Tente novamente.');
    }
  }, [ufsLoaded, showAlert]);

  const loadOrGetMunicipios = useCallback(async (siglaEstado: string, currentCidade?: string): Promise<{cidades: string[], matchedCidade?: string}> => {
    if (cidadesPorUf[siglaEstado] && cidadesPorUf[siglaEstado].length > 0) {
      const cidades = cidadesPorUf[siglaEstado];
      let matched = currentCidade;
      if (currentCidade && !cidades.includes(currentCidade)) {
        const m = findMatchingCidade(currentCidade, cidades);
        if (m) matched = m;
      }
      return { cidades, matchedCidade: matched };
    }
    try {
      const municipiosData = await fetchMunicipios(siglaEstado);
      const cidades = municipiosData.map((m) => m.nome);
      setCidadesPorUf((prev) => ({ ...prev, [siglaEstado]: cidades }));
      let matched = currentCidade;
      if (currentCidade && !cidades.includes(currentCidade)) {
        const m = findMatchingCidade(currentCidade, cidades);
        if (m) matched = m;
      }
      return { cidades, matchedCidade: matched };
    } catch (error: any) {
      console.error('❌ Erro ao carregar municípios:', error.message);
      showAlert('Erro', 'Não foi possível carregar as cidades. Tente novamente.');
      return { cidades: [], matchedCidade: currentCidade };
    }
  }, [cidadesPorUf, findMatchingCidade, showAlert]);

  // Função para carregar municípios apenas quando o campo de cidade recebe foco
  const loadMunicipiosOnFocus = useCallback(async (siglaEstado: string) => {
    if (!siglaEstado) return;
    const { matchedCidade } = await loadOrGetMunicipios(siglaEstado, escolas.cidade);
    if (matchedCidade && matchedCidade !== escolas.cidade) {
      updateEscolas({ cidade: matchedCidade });
    }
  }, [loadOrGetMunicipios, escolas.cidade, updateEscolas]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.warn('⚠️ Nenhum token encontrado. Usuário não autenticado.');
          showAlert( 'Aviso', 'Por favor, faça login para carregar os dados.');
          setLoading(false);
          return;
        }

        // Carrega estados sempre no mount
        await loadEstados();

        if (id) {
          try {
            const escolaData = await buscarEscolaPorId(parseInt(id as string));
            let processedData = { ...escolaData };
            if (escolaData.estado) {
              const { matchedCidade } = await loadOrGetMunicipios(escolaData.estado, escolaData.cidade);
              if (matchedCidade && matchedCidade !== escolaData.cidade) {
                processedData = { ...processedData, cidade: matchedCidade };
              }
            }
            setEscolas(processedData);
          } catch (error: any) {
            console.error('❌ Erro ao buscar escola:', error.message);
            showAlert('Erro', 'Não foi possível carregar os dados da escola.');
          }
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar dados iniciais:', error.message);
        if (error.message.includes('401')) {
          showAlert('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
          router.push('/auth/login');
        } else {
          showAlert('Erro', 'Não foi possível carregar os dados. Preencha manualmente.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const handleCepChange = useCallback(async (text: string) => {
    const cepClean = text.replace(/[^0-9]/g, '');
    updateEscolas({ cep: cepClean });

    if (cepClean.length === 8) {
      setCepLoading(true);
      try {
        const cepData = await fetchCepData(cepClean);
        console.log('CEP Data recebido:', cepData); // Debug: verifique o que vem

        // Assume formato ViaCEP ou similar: uf (sigla), localidade (cidade full), logradouro, bairro
        let siglaEstado =  cepData.state || getSiglaFromNome(cepData.state  || '');
        const nomeCidade =  cepData.city || '';

        const updates: Partial<Escola> = {
          logradouro:  cepData.street || '',
          bairro: cepData.neighborhood || '',
        };

        if (siglaEstado) {
          updates.estado = siglaEstado;
          // Carrega cidades se necessário
          let cidadesList = cidadesPorUf[siglaEstado];
          if (!cidadesList || cidadesList.length === 0) {
            const { cidades } = await loadOrGetMunicipios(siglaEstado, nomeCidade);
            cidadesList = cidades;
          }
          // Encontra match normalizado para cidade
          const matchingCidade = findMatchingCidade(nomeCidade, cidadesList);
          if (matchingCidade) {
            updates.cidade = matchingCidade;
            console.log('Cidade mapeada com sucesso:', matchingCidade);
          } else {
            console.warn('⚠️ Cidade do CEP não encontrada na lista (após normalização):', nomeCidade);
            updates.cidade = nomeCidade; // Preserva mesmo se não match exato
          }
        } else {
          console.warn('⚠️ Não foi possível obter sigla do estado do CEP:', cepData);
          updates.estado = cepData.state || '';
          updates.cidade = nomeCidade;
        }

        updateEscolas(updates);
      } catch (error: any) {
        console.error('❌ Erro ao buscar CEP:', error);
        if (error.name === 'BadRequestError') {
          showAlert('Erro de Validação', error.message);
        } else if (error.name === 'NotFoundError') {
          showAlert('Erro', 'CEP não encontrado.');
        } else if (error.name === 'InternalError') {
          showAlert('Erro', 'Erro interno no serviço de CEP.');
        } else {
          showAlert('Erro', error.message || 'Não foi possível buscar o endereço.');
        }
      } finally {
        setCepLoading(false);
      }
    }
  }, [updateEscolas, getSiglaFromNome, findMatchingCidade, showAlert, cidadesPorUf, loadOrGetMunicipios]);

  const handleEstadoChange = useCallback((value: any) => {
    const stateValue = value?.toString() || '';
    updateEscolas({ estado: stateValue, cidade: '' });
    // Limpa cidades se estado mudar
    if (stateValue) {
      loadMunicipiosOnFocus(stateValue);
    }
  }, [updateEscolas, loadMunicipiosOnFocus]);

  const handleEstadoFocus = useCallback(() => {
    loadEstados();
  }, [loadEstados]);

  const handleCidadeFocus = useCallback(() => {
    if (escolas.estado) {
      loadMunicipiosOnFocus(escolas.estado);
    }
  }, [escolas.estado, loadMunicipiosOnFocus]);

  const handleCidadeChange = useCallback((value: any) => {
    const cityValue = value?.toString() || '';
    updateEscolas({ cidade: cityValue });
  }, [updateEscolas]);

  const handleConcluir = useCallback(async () => {
    if (!escolas.nomeInstituicao || !escolas.cep || !escolas.estado || !escolas.cidade) {
      // FIX: Isso deve disparar agora, pois o Modal está renderizado
      showAlert('Erro', 'Preencha todos os campos obrigatórios (Nome, CEP, Estado, Cidade).');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showAlert('Erro', 'Usuário não autenticado. Faça login novamente.');
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
      showAlert('Sucesso', `Escola ${escolas.id ? 'atualizada' : 'cadastrada'} com sucesso!`);
      router.back();
    } catch (error: any) {
      console.error('❌ Erro ao salvar escola:', error);
      if (error.response?.status === 401) {
        showAlert('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
        router.push('/auth/login');
      } else if (error.response?.status === 400) {
        showAlert('Erro', 'Dados inválidos. Verifique os campos e tente novamente.');
      } else {
        showAlert('Erro', 'Não foi possível salvar a escola. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [escolas, router, showAlert]);

  const formFields = useMemo(() => [
    {
      id: 'nomeInstituicao',
      label: "Nome da Instituição",
      placeholder: "Digite o nome da instituição",
      value: escolas.nomeInstituicao || '',
      onChangeText: (value: string) => updateEscolas({ nomeInstituicao: value }),
    },
    {
      id: 'tipo',
      label: "Tipo de Escola",
      placeholder: "Selecione o tipo de escola",
      options: Object.values(TipoEscola).map(t => ({ label: t, value: t })),
      selectedValue: escolas.tipo || TipoEscola.Publica,
      onValueChange: (value: any) => updateEscolas({ tipo: value as TipoEscola }),
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
      options: ufsLoaded ? ufs : [{ label: 'Carregando...', value: '' }],
      selectedValue: escolas.estado || '',
      onValueChange: handleEstadoChange,
      onFocus: handleEstadoFocus,
    },
    {
      id: 'cidade',
      label: "Cidade",
      placeholder: "Informe a cidade",
      options: cidadesDisponiveis.map((cidade) => ({ label: cidade, value: cidade })),
      selectedValue: escolas.cidade || '',
      onValueChange: handleCidadeChange,
      onFocus: handleCidadeFocus,
    },
    {
      id: 'bairro',
      label: "Bairro",
      placeholder: "Digite o bairro",
      value: escolas.bairro || '',
      onChangeText: (value: string) => updateEscolas({ bairro: value }),
    },
    {
      id: 'logradouro',
      label: "Endereço",
      placeholder: "Digite o endereço",
      value: escolas.logradouro || '',
      onChangeText: (value: string) => updateEscolas({ logradouro: value }),
    },
    {
      id: 'numero',
      label: "Número",
      placeholder: "Digite o número",
      value: escolas.numero ? escolas.numero.toString() : '',
      onChangeText: (value: string) => {
        const numValue = value === '' ? 0 : parseInt(value) || 0;
        updateEscolas({ numero: numValue });
      },
      keyboardType: "number-pad" as const,
    },
    {
      id: 'complemento',
      label: "Complemento",
      placeholder: "Digite o complemento",
      value: escolas.complemento || '',
      onChangeText: (value: string) => updateEscolas({ complemento: value }),
    },
  ], [escolas, ufs, cidadesDisponiveis, cepLoading, ufsLoaded, updateEscolas, handleCepChange, handleEstadoChange, handleCidadeChange, handleEstadoFocus, handleCidadeFocus]);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Header title={id ? "Editar Escola" : "Cadastrar Escola"} onBack={() => router.back()} fixed={true} />
      <FlatList
        data={formFields}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.inputContainer, { zIndex: formFields.length - index }]}>
            <InputField {...item} />
            {item.id === 'cep' && cepLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.cepIndicator} />}
          </View>
        )}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Salvar Cadastro"
              onPress={handleConcluir}
              buttonColor={{ backgroundColor: colors.primary2 }}
              disabled={loading}
              loading={loading}
            />
          </View>
        }
        style={styles.list}
      />
      {/* FIX: Renderiza o componente de alerta aqui (sobreposto ao resto) */}
      <CustomAlert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={config.buttons}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop:70
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    overflow: 'visible'
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  inputContainer: {
    marginBottom: 15,
  },
  cepIndicator: {
    marginLeft: 10,
    alignSelf: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});