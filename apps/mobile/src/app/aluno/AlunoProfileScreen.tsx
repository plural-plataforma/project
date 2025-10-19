import { colors, fontSizes } from "@/packages/ui/theme/theme";
import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import { fetchEstados, fetchMunicipios } from "@src/services/locationsService";
import { fetchCepData } from "@src/services/validateCep";
import { Aluno, Responsavel, Laudo } from "@src/types/aluno"; // Importe os tipos corrigidos
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ClockCounterClockwise,
  FilePlus,
  MapTrifold,
  Note,
  Student,
  User,
  UsersThree,
} from "phosphor-react-native";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, FlatList, View, StyleSheet } from "react-native";
import ProfilePhoto from "@src/components/ProfilePhoto";
import { cadastraAluno, buscarAlunoPorId, atualizaAluno } from "@src/services/alunoService";
import { buscarEscolas } from "@src/services/escolasService";
import { Escola } from "@src/types/escolas";
import InputField from "@src/components/InputField";
import SectionGroup from "@src/components/SectionGroup";
import { useCustomAlert, CustomAlert } from '../../hooks/useCustomAlert';
import toTitleCase from "@src/utils/camelCase";

// Tipos para os campos do InputField
interface TextInputField {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  mask?: "cep" | "phone" | "cpf" | (string | RegExp)[];
  editable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onFocus?: () => void;
}

interface DropdownInputField {
  label: string;
  placeholder?: string;
  options: { label: string; value: string | number }[];
  selectedValue: string | number | null;
  onValueChange: (value: string | number | null) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onFocus?: () => void;
}

type InputFieldType = TextInputField | DropdownInputField;

type Section = {
  title: string;
  icon: React.ReactNode;
  fields: InputFieldType[];
};

// Hook para gerar as seções do formulário (expandido com campos do API)
const useAlunoSections = (
  aluno: Aluno,
  setAluno: React.Dispatch<React.SetStateAction<Aluno>>,
  ufs: { label: string; value: string }[],
  ufsLoaded: boolean,
  cidadesPorUf: { [key: string]: string[] },
  setCidadesPorUf: React.Dispatch<React.SetStateAction<{ [key: string]: string[] }>>,
  cidadesDisponiveis: string[],
  escolasLoading: boolean,
  escolas: Escola[],
  cepLoading: boolean,
  enderecoEnabled: boolean,
  handleCepChange: (text: string) => void,
  handleEstadoFocus: () => void,
  handleCidadeFocus: () => void
): Section[] => {
  console.log('🔄 Generating sections with aluno:', aluno); // Debug log para verificar se aluno está populado
  return useMemo(() => [
    {
      title: "Dados Pessoais",
      icon: <User size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Nome Completo",
          placeholder: "Digite o nome completo",
          value: aluno.nomeCompleto || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, nomeCompleto: value })),
        },
        {
          label: "Sexo",
          placeholder: "Selecione o sexo",
          options: [
            { label: "Feminino", value: "F" },
            { label: "Masculino", value: "M" },
          ],
          selectedValue: aluno.sexo || null,
          onValueChange: (value: string | number | null) =>
            setAluno(prev => ({ ...prev, sexo: value?.toString() || "" })),
        },
        {
          label: "CEP",
          placeholder: "Informe o CEP",
          value: aluno.cep || "",
          onChangeText: handleCepChange,
          editable: !cepLoading,
          mask: "cep" as const,
        },
        {
          label: "Estado",
          placeholder: "Informe o estado",
          options: ufsLoaded ? ufs : [{ label: 'Carregando...', value: '' }],
          selectedValue: aluno.estado || null,
          onValueChange: (value: string | number | null) => {
            const stateValue = value?.toString() || "";
            console.log('🔄 Estado selecionado:', stateValue);  // Debug
            setAluno(prev => ({ ...prev, estado: stateValue, cidade: "" }));
            if (stateValue && !cidadesPorUf[stateValue]) {
              fetchMunicipios(stateValue)
                .then((municipiosData) => {
                  const cidades = municipiosData.map((m) => m.nome);
                  setCidadesPorUf((prev) => ({ ...prev, [stateValue]: cidades }));
                })
                .catch((err) => console.error("Erro ao carregar cidades:", err));
            }
          },
          onFocus: handleEstadoFocus,
        },
        {
          label: "Cidade",
          placeholder: aluno.estado ? 'Informe a cidade' : 'Selecione o estado primeiro',
          options: cidadesDisponiveis.length > 0 && cidadesDisponiveis[0] !== 'Selecione o estado primeiro'
            ? cidadesDisponiveis.map((cidade) => ({
              label: toTitleCase(cidade),
              value: cidade,
            }))
            : [{ label: 'Carregando cidades...', value: '' }],
          selectedValue: aluno.cidade || null,
          onValueChange: (value: string | number | null) => {
            const cityValue = value?.toString() || "";
            setAluno(prev => ({ ...prev, cidade: cityValue }));
          },
          onFocus: handleCidadeFocus,
          editable: Boolean(aluno.estado),
          searchable: Boolean(aluno.estado),
          searchPlaceholder: 'Digite para buscar a cidade',
        },
        {
          label: "Bairro",
          placeholder: "Digite o bairro",
          value: aluno.bairro || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, bairro: value })),
          editable: enderecoEnabled,
        },
        {
          label: "Endereço",
          placeholder: "Digite o endereço",
          value: aluno.logradouro || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, logradouro: value })),
          editable: enderecoEnabled,
        },
        {
          label: "Número",
          placeholder: "Digite o número",
          value: aluno.numero ? aluno.numero.toString() : '',
          onChangeText: (value: string) => {
            const numValue = value === '' ? 0 : parseInt(value) || 0;
            setAluno(prev => ({ ...prev, numero: numValue }));
          },
          keyboardType: "number-pad" as const,
          editable: enderecoEnabled,
        },
        {
          label: "Complemento",
          placeholder: "Digite o complemento",
          value: aluno.complemento || '',
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, complemento: value })),
          editable: enderecoEnabled,
        },

      ]
    },
    {
      title: "Dados Escolares",
      icon: <Student size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Escola",
          placeholder: "Selecione a escola",
          options: escolasLoading ? [{ label: 'Carregando...', value: '' }] : escolas.map(e => ({ label: e.nomeInstituicao, value: e.id })),
          selectedValue: aluno.idEscola || null,
          onValueChange: (value: string | number | null) =>
            setAluno(prev => ({ ...prev, idEscola: Number(value) || 0 })),
        },
        {
          label: "Nível de Ensino",
          placeholder: "Selecione o nível",
          options: [
            { label: "Educação Infantil", value: "1" },
            { label: "Ensino Fundamental I - Anos Iniciais", value: "2" },
            { label: "Ensino Fundamental II - Anos Finais", value: "3" },
            { label: "Ensino Médio", value: "4" },
          ],
          selectedValue: aluno.nivelEnsino || null,
          onValueChange: (value: string | number | null) =>
            setAluno(prev => ({ ...prev, nivelEnsino: value?.toString() || "" })),
        },
        {
          label: "Ano",
          placeholder: "Digite o ano",
          value: aluno.ano || '',
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, ano: value })),
        },
        {
          label: "Turno",
          placeholder: "Selecione o turno",
          options: [
            { label: "Manhã", value: "1" },
            { label: "Tarde", value: "2" },
          ],
          selectedValue: aluno.turno || null,
          onValueChange: (value: string | number | null) =>
            setAluno(prev => ({ ...prev, turno: value?.toString() || "" })),
        },

      ]
    },
    {
      title: "Responsável",
      icon: <UsersThree size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Nome Completo do Responsável",
          placeholder: "Digite o nome do responsável",
          value: (aluno.responsavel?.nomeCompleto || ''),
          onChangeText: (value: string) => setAluno(prev => ({
            ...prev,
            responsavel: {
              ...prev.responsavel,
              nomeCompleto: value,
              telefone: prev.responsavel?.telefone || '',
              email: prev.responsavel?.email || ''
            }
          })),
        },
        {
          label: "Telefone do Responsável",
          placeholder: "Digite o telefone do responsável",
          value: (aluno.responsavel?.telefone || ''),
          onChangeText: (value: string) => setAluno(prev => ({
            ...prev,
            responsavel: {
              ...prev.responsavel,
              telefone: value,
              nomeCompleto: prev.responsavel?.nomeCompleto || '',
              email: prev.responsavel?.email || ''
            }
          })),
          mask: "phone" as const,
        },
        {
          label: "Email do Responsável",
          placeholder: "Digite o email do responsável",
          value: (aluno.responsavel?.email || ''),
          onChangeText: (value: string) => setAluno(prev => ({
            ...prev,
            responsavel: {
              ...prev.responsavel,
              email: value,
              nomeCompleto: prev.responsavel?.nomeCompleto || '',
              telefone: prev.responsavel?.telefone || ''
            }
          })),
        },
      ]
    },
    {
      title: "Laudos",
      icon: <Note size={16} weight="fill" color={colors.primary} />,
      fields: [
        // Para simplicidade, adicione inputs para um laudo (expanda para array se necessário)
        {
          label: "Código CID",
          placeholder: "Digite o código CID",
          value: (aluno.laudos && aluno.laudos.length > 0 ? aluno.laudos[0]?.codigoCid || '' : ''),
          onChangeText: (value: string) => {
            const newLaudos = [...(aluno.laudos || [])];
            if (newLaudos.length === 0) {
              newLaudos.push({ codigoCid: '', nomeMedico: '', descricao: '' });
            }
            newLaudos[0] = { ...newLaudos[0], codigoCid: value };
            setAluno(prev => ({ ...prev, laudos: newLaudos }));
          },
        },
        {
          label: "Nome do Médico",
          placeholder: "Digite o nome do médico",
          value: (aluno.laudos && aluno.laudos.length > 0 ? aluno.laudos[0]?.nomeMedico || '' : ''),
          onChangeText: (value: string) => {
            const newLaudos = [...(aluno.laudos || [])];
            if (newLaudos.length === 0) {
              newLaudos.push({ codigoCid: '', nomeMedico: '', descricao: '' });
            }
            newLaudos[0] = { ...newLaudos[0], nomeMedico: value };
            setAluno(prev => ({ ...prev, laudos: newLaudos }));
          },
        },
        {
          label: "Descrição do Laudo",
          placeholder: "Digite a descrição",
          value: (aluno.laudos && aluno.laudos.length > 0 ? aluno.laudos[0]?.descricao || '' : ''),
          onChangeText: (value: string) => {
            const newLaudos = [...(aluno.laudos || [])];
            if (newLaudos.length === 0) {
              newLaudos.push({ codigoCid: '', nomeMedico: '', descricao: '' });
            }
            newLaudos[0] = { ...newLaudos[0], descricao: value };
            setAluno(prev => ({ ...prev, laudos: newLaudos }));
          },
        },
      ]
    },
  ], [aluno, ufs, ufsLoaded, cidadesDisponiveis, cidadesPorUf, cepLoading, enderecoEnabled, handleCepChange, handleEstadoFocus, handleCidadeFocus, escolas, escolasLoading]);
}

export default function AlunoProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isEdit = !!id;
  const [aluno, setAluno] = useState<Aluno>({
    id: isEdit ? parseInt(id as string) : 0,
    nomeCompleto: "",
    cep: "",
    logradouro: "",
    numero: 0,
    complemento: "",
    bairro: "",
    estado: "",
    cidade: "",
    responsavel: { nomeCompleto: "", telefone: "", email: "" },
    sexo: "",
    nivelEnsino: "",
    turno: "",
    ano: "",
    laudos: [], // Array vazio para API
    idEscola: 0,
  });
  const [loading, setLoading] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
  const [ufsLoaded, setUfsLoaded] = useState(false);
  const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>({});
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolasLoading, setEscolasLoading] = useState(true);
  const [enderecoEnabled, setEnderecoEnabled] = useState(false);

  // FIX: Destruture todos os valores necessários para renderizar o alerta
  const { showAlert, handleDismiss, visible, config } = useCustomAlert();

  const cidadesDisponiveis = useMemo(() =>
    aluno.estado ? cidadesPorUf[aluno.estado] || ['Selecione o estado primeiro'] : ['Selecione o estado primeiro'],
    [aluno.estado, cidadesPorUf]
  );

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

  const loadOrGetMunicipios = useCallback(async (siglaEstado: string, currentCidade?: string): Promise<{ cidades: string[], matchedCidade?: string }> => {
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
    const { matchedCidade } = await loadOrGetMunicipios(siglaEstado, aluno.cidade);
    if (matchedCidade && matchedCidade !== aluno.cidade) {
      setAluno(prev => ({ ...prev, cidade: matchedCidade }));
    }
  }, [loadOrGetMunicipios, aluno.cidade]);

  const handleEstadoFocus = useCallback(() => {
    loadEstados();
  }, [loadEstados]);

  const handleCidadeFocus = useCallback(() => {
    if (aluno.estado) {
      loadMunicipiosOnFocus(aluno.estado);
    }
  }, [aluno.estado, loadMunicipiosOnFocus]);

  // Carregar escolas
  useEffect(() => {
    const loadEscolas = async () => {
      try {
        setEscolasLoading(true);
        const escolasData = await buscarEscolas();
        setEscolas(escolasData);
      } catch (error) {
        console.error('Erro ao carregar escolas:', error);
        showAlert('Erro', 'Não foi possível carregar as escolas.');
      } finally {
        setEscolasLoading(false);
      }
    };
    loadEscolas();
  }, [showAlert]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.warn('⚠️ Nenhum token encontrado. Usuário não autenticado.');
          showAlert('Aviso', 'Por favor, faça login para carregar os dados.');
          setLoading(false);
          return;
        }

        // Carrega estados sempre no mount
        await loadEstados();

        if (isEdit) {
          try {
            const alunoData = await buscarAlunoPorId(parseInt(id as string));
            let processedData = { ...alunoData };
            if (alunoData.estado) {
              const { matchedCidade } = await loadOrGetMunicipios(alunoData.estado, alunoData.cidade);
              if (matchedCidade && matchedCidade !== alunoData.cidade) {
                processedData = { ...processedData, cidade: matchedCidade };
              }
            }
            setAluno(processedData);
          } catch (error: any) {
            console.error('❌ Erro ao buscar aluno:', error.message);
            showAlert('Erro', 'Não foi possível carregar os dados do aluno.');
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
  }, [id, isEdit, showAlert, router]);

  const handleCepChange = useCallback(async (text: string) => {
    const cepClean = text.replace(/[^0-9]/g, '');
    setAluno(prev => ({ ...prev, cep: cepClean }));

    if (cepClean.length === 8) {
      setCepLoading(true);
      try {
        const cepData = await fetchCepData(cepClean);
        console.log('CEP Data recebido:', cepData);

        let siglaEstado = cepData.state || getSiglaFromNome(cepData.state || '');
        const nomeCidade = cepData.city || '';

        const updates: Partial<Aluno> = {
          logradouro: cepData.street || '',
          bairro: cepData.neighborhood || '',
        };

        if (siglaEstado) {
          updates.estado = siglaEstado;
          let cidadesList = cidadesPorUf[siglaEstado];
          if (!cidadesList || cidadesList.length === 0) {
            const { cidades } = await loadOrGetMunicipios(siglaEstado, nomeCidade);
            cidadesList = cidades;
          }
          const matchingCidade = findMatchingCidade(nomeCidade, cidadesList);
          if (matchingCidade) {
            updates.cidade = matchingCidade;
            console.log('Cidade mapeada com sucesso:', matchingCidade);
          } else {
            console.warn('⚠️ Cidade do CEP não encontrada na lista (após normalização):', nomeCidade);
            updates.cidade = nomeCidade;
          }
        } else {
          console.warn('⚠️ Não foi possível obter sigla do estado do CEP:', cepData);
          updates.estado = cepData.state || '';
          updates.cidade = nomeCidade;
        }

        setAluno(prev => ({ ...prev, ...updates }));
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
  }, [getSiglaFromNome, findMatchingCidade, showAlert, cidadesPorUf, loadOrGetMunicipios]);

  const handleConcluir = useCallback(async () => {
    // Validação client-side alinhada com API obrigatórios
    if (!aluno.nomeCompleto?.trim()) {
      showAlert("Erro", "O nome completo é obrigatório.");
      return;
    }
    if (!aluno.estado) {
      showAlert("Erro", "O estado é obrigatório.");
      return;
    }
    if (!aluno.idEscola || aluno.idEscola === 0) {
      showAlert("Erro", "Selecione uma escola.");
      return;
    }
    if (!aluno.nivelEnsino?.trim()) {
      showAlert("Erro", "Selecione o nível de ensino.");
      return;
    }
    if (!aluno.responsavel?.nomeCompleto?.trim()) {
      showAlert("Erro", "O nome do responsável é obrigatório.");
      return;
    }
    // FIX: Validação obrigatória para Laudo (pelo menos um com todos os campos preenchidos)
    if (!aluno.laudos || aluno.laudos.length === 0 ||
      !aluno.laudos[0]?.codigoCid?.trim() ||
      !aluno.laudos[0]?.nomeMedico?.trim() ||
      !aluno.laudos[0]?.descricao?.trim()) {
      showAlert("Erro", "Informe os dados do laudo (Código CID, Nome do Médico e Descrição).");
      return;
    }

    setLoading(true);
    try {
      // Mapeamento para payload exato da API (sem extras, laudos como array)
      const payload: Partial<Aluno> = {
        id: aluno.id,
        nomeCompleto: aluno.nomeCompleto,
        cep: aluno.cep,
        logradouro: aluno.logradouro,
        numero: aluno.numero || 0,
        complemento: aluno.complemento,
        bairro: aluno.bairro,
        estado: aluno.estado,
        cidade: aluno.cidade,
        idEscola: aluno.idEscola,
        nivelEnsino: aluno.nivelEnsino,
        ano: aluno.ano,
        turno: aluno.turno,
        sexo: aluno.sexo,
        responsavel: aluno.responsavel, // Objeto completo
        laudos: aluno.laudos || [], // Array
      };

      let result;
      if (isEdit) {
        result = await atualizaAluno(payload);
        console.log("✅ Aluno atualizado:", result);
        showAlert("Sucesso", "Perfil do aluno atualizado com sucesso.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        result = await cadastraAluno(payload);
        console.log("✅ Aluno cadastrado:", result);
        showAlert("Sucesso", "Aluno cadastrado com sucesso.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      if (error?.response) {
        console.error("❌ Erro ao " + (isEdit ? "atualizar" : "cadastrar") + " aluno - response:", error.response);
        const status = error.response.status;
        const data = error.response.data;
        const serverMessage = data?.message || JSON.stringify(data) || error.message;
        showAlert("Erro", `(${status}) ${serverMessage}`);
      } else {
        console.error("❌ Erro ao " + (isEdit ? "atualizar" : "cadastrar") + " aluno:", error);
        const message = error?.message || `Não foi possível ${isEdit ? "atualizar" : "cadastrar"} o aluno.`;
        showAlert("Erro", message);
      }
    } finally {
      setLoading(false);
    }
  }, [aluno, isEdit, showAlert, router]);

  const sections = useAlunoSections(
    aluno,
    setAluno,
    ufs,
    ufsLoaded,
    cidadesPorUf,
    setCidadesPorUf,
    cidadesDisponiveis,
    escolasLoading,
    escolas,
    cepLoading,
    enderecoEnabled,
    handleCepChange,
    handleEstadoFocus,
    handleCidadeFocus
  );

  const renderItem = useCallback(({ item, index }: { item: Section; index: number }) => (
    <SectionGroup title={item.title} icon={item.icon}>
      {item.fields.map((field, fieldIndex) => (
        <InputField
          key={fieldIndex}
          {...field}
          label={field.label || ''}
          placeholder={field.placeholder || ''}
          style={styles.inputContainer}
        />
      ))}
      {item.title === "Dados Pessoais" && cepLoading && (
        <ActivityIndicator size="small" color={colors.primary} />
      )}
    </SectionGroup>
  ), [sections, cepLoading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, zIndex: -1, backgroundColor: '#fff', overflow: 'visible' }}>
      <Header title={isEdit ? "Editar Perfil do Aluno" : "Perfil do Aluno"} onBack={() => router.back()} fixed={true} />
      <FlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <>
            <View style={{ flex: 1, marginTop: 20 }}>
              {/* <ProfilePhoto /> */}
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.button}>
            <CustomButton
              title={isEdit ? "Atualizar Perfil" : "Concluir Cadastro"}
              onPress={handleConcluir}
              buttonColor={{ backgroundColor: colors.primary2 }}
              disabled={loading}
              loading={loading}
            />
          </View>
        }
        contentContainerStyle={[styles.content, { zIndex: -1 }]}
        style={styles.container}
      />
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
    paddingHorizontal: 20,
    paddingTop: 70
  },
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  titleInstrucao: {
    textAlign: "justify",
    fontSize: fontSizes.f18,
    marginTop: 17,
    marginBottom: 8,
    lineHeight: 22,
    color: colors.primary,
    fontFamily: "Nunito_400Regular",
  },
  obsInstrucao: {
    fontSize: fontSizes.f16,
    lineHeight: 24,
    color: colors.primary,
    marginBottom: 30,
  },
  button: {
    alignItems: "center",
    marginTop: 20,
  },
});