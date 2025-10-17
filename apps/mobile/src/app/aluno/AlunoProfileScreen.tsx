import { colors, fontSizes } from "@/packages/ui/theme/theme";
import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import { fetchEstados, fetchMunicipios } from "@src/services/locationsService";
import { fetchCepData } from "@src/services/validateCep";
import { Aluno } from "@src/types/aluno";
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
import { useCustomAlert } from '../../hooks/useCustomAlert';
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

// Hook para gerar as seções do formulário
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
          editable: true,
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
          value: aluno.numero ? aluno.numero.toString() : "",
          onChangeText: (value: string) => {
            const numValue = value === "" ? 0 : parseInt(value) || 0;
            setAluno(prev => ({ ...prev, numero: numValue }));
          },
          editable: enderecoEnabled,
        },
        {
          label: "Complemento",
          placeholder: "Digite o complemento",
          value: aluno.complemento || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, complemento: value })),
          editable: enderecoEnabled,
        },
      ],
    },
    {
      title: "Dados do Responsável",
      icon: <UsersThree size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Nome do Responsável",
          placeholder: "Digite o nome do responsável",
          value: aluno.responsavel || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, responsavel: value })),
        },
        {
          label: "Contato",
          placeholder: "(00) 00000-0000",
          mask: "phone" as const,
          value: aluno.telefone || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, telefone: value })),
        },
        {
          label: "E-mail",
          placeholder: "Digite o e-mail",
          value: aluno.email || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, email: value })),
        },
      ],
    },
    {
      title: "Dados Escolares",
      icon: <Student size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Nível Escolar",
          placeholder: "Informe o nível escolar",
          options: [
            { label: "Educação Infantil", value: 1 },
            { label: "Ensino Fundamental I - Anos Iniciais", value: 2 },
            { label: "Ensino Fundamental II - Anos Finais", value: 3 },
            { label: "Ensino Médio", value: 4 },
          ],
          selectedValue: aluno.nivelEscolar || null,
          onValueChange: (value: string | number | null) =>
            setAluno(prev => ({ ...prev, nivelEscolar: value ? Number(value) : 0 })),
        },
        {
          label: "Turno",
          placeholder: "Informe o turno",
          options: [
            { label: "Manhã", value: "1" },
            { label: "Tarde", value: "2" },
          ],
          selectedValue: aluno.turno || null,
          onValueChange: (value: any) =>
            setAluno(prev => ({ ...prev, turno: value.toString() || "" })),
        },
        {
          label: "Escola/Instituição",
          placeholder: escolasLoading ? "Carregando escolas..." : "Informe a escola/instituição",
          options: escolasLoading
            ? []
            : !escolas || escolas.length === 0
            ? [{ label: "Nenhuma escola disponível", value: "" }]
            : escolas
                .filter((escola) => escola.nomeInstituicao && escola.id)
                .map((escola) => ({
                  label: escola.nomeInstituicao!,
                  value: escola.id!.toString(),
                })),
          selectedValue: aluno.idEscola ? aluno.idEscola.toString() : null,
          onValueChange: (value: string | number | null) =>
            setAluno(prev => ({ ...prev, idEscola: value ? Number(value) : 0 })),
          editable: !escolasLoading,
          searchable: true,
          searchPlaceholder: 'Digite para buscar a escola',
        },
        {
          label: "Professor Responsável",
          placeholder: "Informe o professor",
          options: [
            { label: "Prof 1", value: 101 },
            { label: "Prof 2", value: 2 },
          ],
          selectedValue: aluno.idProfessor || null,
          onValueChange: (value: string | number | null) =>
            setAluno(prev => ({ ...prev, idProfessor: value ? Number(value) : 0 })),
        },
      ],
    },
    {
      title: "Descrição do Laudo",
      icon: <FilePlus size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "CID",
          placeholder: "Código CID",
          value: aluno.cid || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, cid: value })),
        },
        {
          label: "Médico Responsável",
          placeholder: "Nome Profissional",
          value: aluno.responsavelMedico || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, responsavelMedico: value })),
        },
        {
          label: "Descrição",
          placeholder: "Digite a descrição do laudo",
          value: aluno.descricaoLaudo || "",
          onChangeText: (value: string) => setAluno(prev => ({ ...prev, descricaoLaudo: value })),
        },
      ],
    },
    {
      title: "Plano Desenvolvimento Individual",
      icon: <MapTrifold size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Plano",
          placeholder: "Digite o plano de desenvolvimento",
          value: aluno.planoDesenvolvimento || "",
          onChangeText: (value: string) =>
            setAluno(prev => ({ ...prev, planoDesenvolvimento: value })),
        },
      ],
    },
    {
      title: "Histórico de Atendimento",
      icon: <ClockCounterClockwise size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Histórico",
          placeholder: "Digite o histórico de atendimento",
          value: aluno.historicoAtendimento || "",
          onChangeText: (value: string) =>
            setAluno(prev => ({ ...prev, historicoAtendimento: value })),
        },
      ],
    },
    {
      title: "Observações Gerais",
      icon: <Note size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Observações",
          placeholder: "Digite as observações gerais",
          value: aluno.observacoesGerais || "",
          onChangeText: (value: string) =>
            setAluno(prev => ({ ...prev, observacoesGerais: value })),
        },
      ],
    },
  ], [
    aluno,
    ufs,
    ufsLoaded,
    cidadesDisponiveis,
    escolasLoading,
    escolas,
    cepLoading,
    enderecoEnabled,
    handleCepChange,
    setAluno,
    cidadesPorUf,
    setCidadesPorUf,
    handleEstadoFocus,
    handleCidadeFocus
  ]);
};

export default function AlunoProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const alunoId = params.id ? Number(params.id) : null;
  const isEdit = !!alunoId;
  const [aluno, setAluno] = useState<Aluno>({
    id: 0,
    nomeCompleto: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: 0,
    complemento: "",
    bairro: "",
    estado: "",
    cidade: "",
    telefone: "",
    responsavel: "",
    sexo: "",
    nivelEscolar: 0,
    turno: "",
    cid: "",
    descricaoLaudo: "",
    responsavelMedico: "",
    planoDesenvolvimento: "",
    historicoAtendimento: "",
    observacoesGerais: "",
    idEscola: 0,
    idProfessor: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
  const [ufsLoaded, setUfsLoaded] = useState<boolean>(false);
  const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>({});
  const cidadesDisponiveis = useMemo(() => 
    aluno.estado && cidadesPorUf[aluno.estado] && cidadesPorUf[aluno.estado].length > 0
      ? cidadesPorUf[aluno.estado]
      : aluno.estado
      ? [aluno.cidade || 'Carregando cidades...']
      : ['Selecione o estado primeiro'], 
    [aluno.estado, cidadesPorUf, aluno.cidade]
  );
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolasLoading, setEscolasLoading] = useState<boolean>(false);

  const { showAlert } = useCustomAlert();
    
  // Allow manual editing of address fields by default. City search will only be enabled when state is provided.
  const enderecoEnabled = true;

  // Função para normalizar e encontrar cidade exata na lista
  const findMatchingCidade = useCallback((nomeCidade: string, cidadesList: string[]): string | null => {
    if (!nomeCidade || !cidadesList.length) return null;
    const normalizedInput = nomeCidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const match = cidadesList.find(cidade => 
      cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedInput
    );
    return match || null;
  }, []);

  // Função para mapear nome completo do estado para sigla (como em EscolaScreen)
  const getSiglaFromNome = useCallback((nomeEstado: string): string => {
    if (!nomeEstado) return '';
    const normalizedNome = nomeEstado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const uf = ufs.find(ufItem => 
      ufItem.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedNome
    );
    return uf ? uf.value : nomeEstado.toUpperCase();  // Fallback para sigla se já for
  }, [ufs]);

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

  // Função para carregar estados (sempre no mount, como em EscolaScreen)
  const loadEstados = useCallback(async () => {
    if (ufsLoaded) return;
    try {
      const estadosData = await fetchEstados();
      const formattedUfs = estadosData.map((uf) => ({ label: uf.nome, value: uf.sigla }));
      setUfs(formattedUfs);
      setUfsLoaded(true);
      console.log('✅ UFs carregados:', formattedUfs.length);  // Debug: deve logar 27
    } catch (error: any) {
      console.error('❌ Erro ao carregar estados:', error.message);
      showAlert('Erro', 'Não foi possível carregar os estados. Tente novamente.');
      setUfs([]);  // Fallback vazio para retry
    }
  }, [ufsLoaded, showAlert]);

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
    loadMunicipiosOnFocus(aluno.estado);
  }, [aluno.estado, loadMunicipiosOnFocus]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setEscolasLoading(true);
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.warn("⚠️ Nenhum token encontrado. Usuário não autenticado.");
          showAlert("Aviso", "Por favor, faça login para carregar seus dados.");
          setLoading(false);
          setEscolasLoading(false);
          return;
        }

        // Fetch escolas
        const escolasData = await buscarEscolas();
        setEscolas(escolasData);

        // Carrega estados sempre no mount (como em EscolaScreen)
        await loadEstados();

        // If editing, fetch aluno data using buscarAlunoPorId
        if (isEdit) {
          console.log('🔍 Fetching aluno data for ID:', alunoId); // Debug log
          const rawAluno = await buscarAlunoPorId(alunoId!); 
          console.log('📥 Fetched rawAluno:', rawAluno); // Debug log

          if (!rawAluno.id) {
            throw new Error('ID do aluno não encontrado nos dados carregados.');
          }

          let processedData = { ...rawAluno };

          // Normaliza estado para sigla se necessário (como em EscolaScreen)
          let estadoSigla = '';
          if (rawAluno.estado) {
            estadoSigla = getSiglaFromNome(rawAluno.estado);
            processedData = { ...processedData, estado: estadoSigla };
            console.log('🔄 Estado normalizado:', rawAluno.estado, '→', estadoSigla);  // Debug
          }

          // Carrega cidades usando a sigla normalizada
          if (estadoSigla) {
            const { matchedCidade } = await loadOrGetMunicipios(estadoSigla, rawAluno.cidade);
            if (matchedCidade && matchedCidade !== rawAluno.cidade) {
              processedData = { ...processedData, cidade: matchedCidade };
            }
          }

          // Mapeamento para Aluno (corrigindo nomes de campos e tipos)
          const mappedAluno: Aluno = {
            id: processedData.id || 0,
            nomeCompleto: processedData.nomeCompleto || "",
            email: processedData.email || "", // Ausente na API, fica vazio
            cep: processedData.cep || "",
            logradouro: processedData.logradouro || "",
            numero: processedData.numero || 0,
            complemento: processedData.complemento || "",
            bairro: processedData.bairro || "",
            estado: processedData.estado || "",  // Agora é sigla garantida
            cidade: processedData.cidade || "",
            telefone: processedData.telefone ? String(processedData.telefone) : "", // Converte para string para máscara
            responsavel: processedData.responsavel || "", // Ausente, fica vazio
            sexo: processedData.sexo || "", // Ausente
            nivelEscolar: processedData.nivelEnsino ? Number(processedData.nivelEnsino) : 0, // Mapeia nivelEnsino -> nivelEscolar
            turno: processedData.turno || "", // Converte para número
            cid: processedData.cid || "", // Ausente
            descricaoLaudo: processedData.descricaoLaudo || "", // Ausente
            responsavelMedico: processedData.responsavelMedico || "", // Ausente
            planoDesenvolvimento: processedData.planoDesenvolvimento || "", // Ausente
            historicoAtendimento: processedData.historicoAtendimento || "", // Ausente
            observacoesGerais: processedData.observacoesGerais || "", // Ausente
            idEscola: processedData.idEscola || 0,
            idProfessor: processedData.idProfessor || 0, // Ausente, fica 0
            // Ignora 'ano' por enquanto (adicione se precisar mapear para algo)
          };

          console.log('✅ Mapped aluno to:', mappedAluno); // Debug após mapeamento
          setAluno(mappedAluno);
        }

      } catch (error: any) {
        console.error("Erro ao carregar dados iniciais:", error.message);
        if (error.message.includes("401")) {
          showAlert(
            "Erro de Autenticação",
            "Sua sessão expirou. Faça login novamente."
          );
          router.push("/auth/login");
        } else {
          showAlert(
            "Erro",
            isEdit ? "Não foi possível carregar os dados do aluno. Preencha manualmente." : "Não foi possível carregar os dados. Preencha manualmente."
          );
          // Para edição com erro, reseta idEscola para evitar payloads inválidos
          setAluno((prev) => ({
            ...prev,
            id: 0, // Evita edição acidental
            idEscola: 0,
          }));
        }
      } finally {
        setLoading(false);
        setEscolasLoading(false);
      }
    };
    fetchInitialData();
  }, [isEdit, alunoId]);  // Deps mínimas, como em EscolaScreen

  const handleCepChange = useCallback(async (text: string) => {
    const cepClean = text.replace(/[^0-9]/g, "");
    setAluno(prev => ({ ...prev, cep: cepClean }));

    if (cepClean.length === 8) {
      setCepLoading(true);
      try {
        const cepData = await fetchCepData(cepClean);
        console.log('CEP Data recebido:', cepData); // Debug: verifique o que vem

        // Assume formato ViaCEP ou similar: uf (sigla), localidade (cidade full), logradouro, bairro
        let siglaEstado = cepData.state || getSiglaFromNome(cepData.state || '');
        const nomeCidade = cepData.city || '';

        const updates = {
          estado: cepData.state || "",
          cidade: cepData.city || "",
          logradouro: cepData.street || "",
          bairro: cepData.neighborhood || "",
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
            updates.cidade = nomeCidade; // Preserva mesmo se não match exato (como em Escola)
          }
        } else {
          console.warn('⚠️ Não foi possível obter sigla do estado do CEP:', cepData);
          updates.estado = cepData.state || '';
          updates.cidade = nomeCidade;
        }

        setAluno(prev => ({ ...prev, ...updates }));
      } catch (error: any) {
        console.error("Erro ao buscar CEP:", error);
        if (error.name === "BadRequestError") {
          showAlert("Erro de Validação", error.message);
        } else if (error.name === "NotFoundError") {
          showAlert("Erro", "CEP não encontrado.");
        } else if (error.name === "InternalError") {
          showAlert("Erro", "Erro interno no serviço de CEP.");
        } else {
          showAlert("Erro", error.message || "Não foi possível buscar o endereço.");
        }
      } finally {
        setCepLoading(false);
      }
    }
  }, [getSiglaFromNome, findMatchingCidade, showAlert, cidadesPorUf, loadOrGetMunicipios]);

  const handleConcluir = useCallback(async () => {

    // Basic client-side validation (como em Escola)
    if (!aluno.nomeCompleto || aluno.nomeCompleto.trim() === "") {
      showAlert("Erro", "O nome do aluno é obrigatório.");
      return;
    }

    // Validação extra para escola
    if (!aluno.idEscola || aluno.idEscola === 0) {
      showAlert("Erro", "Selecione uma escola.");
      return;
    }

    // Validação extra para edição
    if (isEdit && (!aluno.id || aluno.id === 0)) {
      showAlert("Erro", "ID do aluno inválido para edição.");
      return;
    }

    setLoading(true);
    try {
      // Mapeamento reverso para formato da API
      const payload = {
        ...aluno,
        nivelEnsino: aluno.nivelEscolar.toString() , // Mapeia de volta para nivelEnsino (string)
        // Adicione outros mapeamentos se necessário (ex.: turno para string se API esperar)
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
      // Try to surface axios response data when available for easier debugging
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
  }, [aluno, isEdit, showAlert]);

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
       <Header title={isEdit ? "Editar Perfil do Aluno" : "Perfil do Aluno"} onBack={() => router.back()} fixed={true}/>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop:70
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
    fontSize: fontSizes.f24,
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