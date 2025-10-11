import { colors, fontSizes } from "@/packages/ui/theme/theme";
import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import InputField from "@src/components/InputField";
import SectionGroup from "@src/components/SectionGroup";
import { fetchEstados, fetchMunicipios } from "@src/services/locationsService";
import { fetchCepData } from "@src/services/validateCep";
import { Aluno } from "@src/types/aluno";
import { useRouter } from "expo-router";
import {
  ClockCounterClockwise,
  FilePlus,
  MapTrifold,
  Note,
  Student,
  User,
  UsersThree,
} from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, FlatList, View, StyleSheet } from "react-native";
import { Alert } from "react-native";
import ProfilePhoto from "@src/components/ProfilePhoto";
import { atualizarAluno } from "@src/services/alunoService";

// Tipos para os campos do InputField
interface TextInputField {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  mask?: "cep" | "phone" | "cpf" | (string | RegExp)[];
  editable?: boolean;
}

interface DropdownInputField {
  label: string;
  placeholder?: string;
  options: { label: string; value: string | number }[];
  selectedValue: string | number | null;
  onValueChange: (value: string | number | null) => void;
}

type InputFieldType = TextInputField | DropdownInputField;

export default function AlunoProfileScreen() {
  const router = useRouter();
  const [aluno, setAluno] = useState<Aluno>({
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
    turno: 0,
    cid: "",
    descricaoLaudo: "",
    responsavelMedico: "",
    planoDesenvolvimento: "",
    historicoAtendimento: "",
    observacoesGerais: "",
    escolas: 0,
    idProfessor: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
  const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>({});
  const cidadesDisponiveis = aluno.estado
    ? cidadesPorUf[aluno.estado] || ["Selecione o estado primeiro"]
    : ["Selecione o estado primeiro"];
  const [openedDropdownIndex, setOpenedDropdownIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.warn("⚠️ Nenhum token encontrado. Usuário não autenticado.");
          Alert.alert("Aviso", "Por favor, faça login para carregar seus dados.");
          setLoading(false);
          return;
        }

        const estadosData = await fetchEstados();
        const formattedUfs = estadosData.map((uf) => ({
          label: uf.nome,
          value: uf.sigla,
        }));
        setUfs(formattedUfs);

        const municipiosData = await fetchMunicipios("RS");
        const cidadesRS = municipiosData.map((m) => m.nome);
        setCidadesPorUf((prev) => ({ ...prev, RS: cidadesRS }));
      } catch (error: any) {
        console.error("Erro ao carregar dados iniciais:", error.message);
        if (error.message.includes("401")) {
          Alert.alert(
            "Erro de Autenticação",
            "Sua sessão expirou. Faça login novamente."
          );
          router.push("/auth/login");
        } else {
          Alert.alert(
            "Erro",
            "Não foi possível carregar os dados. Preencha manualmente."
          );
          setAluno((prev) => ({
            ...prev,
            estado: "SP",
            cidade: "São Paulo",
            escolas: 0,
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleCepChange = async (text: string) => {
    const cepClean = text.replace(/[^0-9]/g, "");
    setAluno({ ...aluno, cep: cepClean });

    if (cepClean.length === 8) {
      setCepLoading(true);
      try {
        const cepData = await fetchCepData(cepClean);
        setAluno((prev) => ({
          ...prev,
          logradouro: cepData.street || "",
          bairro: cepData.neighborhood || "",
          estado: cepData.state || "",
          cidade: cepData.city || "",
        }));

        if (cepData.state && !cidadesPorUf[cepData.state]) {
          const municipiosData = await fetchMunicipios(cepData.state);
          const cidades = municipiosData.map((m) => m.nome);
          setCidadesPorUf((prev) => ({ ...prev, [cepData.state]: cidades }));
        }
      } catch (error: any) {
        console.error("Erro ao buscar CEP:", error);
        if (error.name === "BadRequestError") {
          Alert.alert("Erro de Validação", error.message);
        } else if (error.name === "NotFoundError") {
          Alert.alert("Erro", "CEP não encontrado.");
        } else if (error.name === "InternalError") {
          Alert.alert("Erro", "Erro interno no serviço de CEP.");
        } else {
          Alert.alert("Erro", error.message || "Não foi possível buscar o endereço.");
        }
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleConcluir = async () => { };

  const sections = [
    {
      title: "Dados Pessoais",
      icon: <User size={16} weight="fill" color={colors.primary} />,
      fields: [
        {
          label: "Nome Completo",
          placeholder: "Digite o nome completo",
          value: aluno.nomeCompleto || "",
          onChangeText: (value: string) => setAluno({ ...aluno, nomeCompleto: value }),
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
            setAluno({ ...aluno, sexo: value?.toString() || "" }),
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
          options: ufs,
          selectedValue: aluno.estado || null,
          onValueChange: (value: string | number | null) => {
            const stateValue = value?.toString() || "";
            setAluno({ ...aluno, estado: stateValue, cidade: "" });
            if (stateValue && !cidadesPorUf[stateValue]) {
              fetchMunicipios(stateValue)
                .then((municipiosData) => {
                  const cidades = municipiosData.map((m) => m.nome);
                  setCidadesPorUf((prev) => ({ ...prev, [stateValue]: cidades }));
                })
                .catch((err) => console.error("Erro ao carregar cidades:", err));
            }
          },
        },
        {
          label: "Cidade",
          placeholder: "Informe a cidade",
          options: cidadesDisponiveis.map((cidade) => ({
            label: cidade,
            value: cidade,
          })),
          selectedValue: aluno.cidade || null,
          onValueChange: (value: string | number | null) => {
            const cityValue = value?.toString() || "";
            setAluno({ ...aluno, cidade: cityValue });
          },
        },
        {
          label: "Bairro",
          placeholder: "Digite o bairro",
          value: aluno.bairro || "",
          onChangeText: (value: string) => setAluno({ ...aluno, bairro: value }),
        },
        {
          label: "Endereço",
          placeholder: "Digite o endereço",
          value: aluno.logradouro || "",
          onChangeText: (value: string) => setAluno({ ...aluno, logradouro: value }),
        },
        {
          label: "Número",
          placeholder: "Digite o número",
          value: aluno.numero ? aluno.numero.toString() : "",
          onChangeText: (value: string) => {
            const numValue = value === "" ? 0 : parseInt(value) || 0;
            setAluno({ ...aluno, numero: numValue });
          },
        },
        {
          label: "Complemento",
          placeholder: "Digite o complemento",
          value: aluno.complemento || "",
          onChangeText: (value: string) => setAluno({ ...aluno, complemento: value }),
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
          onChangeText: (value: string) => setAluno({ ...aluno, responsavel: value }),
        },
        {
          label: "Contato",
          placeholder: "(00) 00000-0000",
          mask: "phone" as const,
          value: aluno.telefone || "",
          onChangeText: (value: string) => setAluno({ ...aluno, telefone: value }),
        },
        {
          label: "E-mail",
          placeholder: "Digite o e-mail",
          value: aluno.email || "",
          onChangeText: (value: string) => setAluno({ ...aluno, email: value }),
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
            setAluno({ ...aluno, nivelEscolar: value ? Number(value) : 0 }),
        },
        {
          label: "Turno",
          placeholder: "Informe o turno",
          options: [
            { label: "Manhã", value: 1 },
            { label: "Tarde", value: 2 }
          ],
          selectedValue: aluno.turno || null,
          onValueChange: (value: string | number | null) =>
            setAluno({ ...aluno, turno: value ? Number(value) : 0 }),
        },
           {
          label: "Escola/Instituição",
          placeholder: "Informe a escola/institução",
          options: [
            { label: "Escola 1", value: 1 },
            { label: "Escola 2", value: 2 }
          ],
          selectedValue: aluno.escolas || null,
          onValueChange: (value: string | number | null) =>
            setAluno({ ...aluno, escolas: value ? Number(value) : 0 }),
        },
        {
          label: "Professor Responsável",
          placeholder: "Informe o professor",
          options: [
            { label: "PROF 1", value: 1 },
            { label: "Prof 2", value: 2 }
          ],
          selectedValue: aluno.idProfessor || null,
          onValueChange: (value: string | number | null) =>
            setAluno({ ...aluno, idProfessor: value ? Number(value) : 0 }),
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
          onChangeText: (value: string) => setAluno({ ...aluno, cid: value }),
        },
        {
          label: "Médico Responsável",
          placeholder: "Nome Profissional",
          value: aluno.responsavelMedico || "",
          onChangeText: (value: string) => setAluno({ ...aluno, responsavelMedico: value }),
        },
        {
          label: "Descrição",
          placeholder: "Digite a descrição do laudo",
          value: aluno.descricaoLaudo || "",
          onChangeText: (value: string) => setAluno({ ...aluno, descricaoLaudo: value }),
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
            setAluno({ ...aluno, planoDesenvolvimento: value }),
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
            setAluno({ ...aluno, historicoAtendimento: value }),
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
            setAluno({ ...aluno, observacoesGerais: value }),
        },
      ],
    },
  ];

  const renderItem = ({ item, index }: { item: typeof sections[number]; index: number }) => (
    <SectionGroup title={item.title} icon={item.icon}>
      {item.fields.map((field, fieldIndex) => {
        const isDropdown = "options" in field;
        const uniqueIndex = `${index}-${fieldIndex}`;
        const numericIndex = index * 10 + fieldIndex;
        const dynamicZIndex = 100 - numericIndex;

        return (
          <InputField
            key={fieldIndex}
            label={field.label || ''}
            placeholder={field.placeholder || ''}
            {...(isDropdown
              ? {
                options: field.options,
                selectedValue: field.selectedValue,
                onValueChange: (value) => {
                  field.onValueChange?.(value);
                  setOpenedDropdownIndex(null); // Fecha o dropdown após seleção
                }
              }
              : {
                value: field.value || '',
                onChangeText: field.onChangeText,
                mask: field.mask,
                editable: "editable" in field ? field.editable : true,
              })}
            style={[styles.inputContainer, { zIndex: dynamicZIndex, position: 'relative' }]}
            dropDownContainerStyle={
              isDropdown
                ? {
                  zIndex: dynamicZIndex,
                  elevation: 1000,
                  position: 'absolute',
                  top: 55,
                }
                : undefined
            }
            openDropdown={openedDropdownIndex === numericIndex}
            onOpenDropdown={() => {
              // Se clicar, define esse index como aberto ou fecha se já for o mesmo
              setOpenedDropdownIndex((prev) =>
                prev === numericIndex ? null : numericIndex
              );
            }}

            onFocusTextInput={() => {
              // fechar dropdowns se focar input de texto
              setOpenedDropdownIndex(null);
            }}
          />
        );
      })}

      {item.title === "CEP" && cepLoading && (
        <ActivityIndicator size="small" color={colors.primary} />
      )}
    </SectionGroup>
  );


  return (
    <View style={{ flex: 1, zIndex: -1, backgroundColor: '#fff', overflow: 'visible' }}>
      <FlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <>
            <Header title="Perfil do Aluno" onBack={() => router.back()} />
            <View style={{ flex: 1, marginTop: 20 }}>
              {/* <ProfilePhoto /> */}
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.button}>
            <CustomButton
              title="Concluir Cadastro"
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