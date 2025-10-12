import { colors } from "@/packages/ui/theme/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import InputField from "@src/components/InputField";
import SectionGroup from "@src/components/SectionGroup";
import { fetchEstados, fetchMunicipios } from "@src/services/locationsService";
import { fetchCepData } from "@src/services/validateCep";
import { Escolas, TipoEscola } from "@src/types/escolas";
import { group } from "console";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";

export default function EscolaScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [cepLoading, setCepLoading] = useState<boolean>(false);
    const [ufs, setUfs] = useState<{ label: string; value: string }[]>([]);
    const [cidadesPorUf, setCidadesPorUf] = useState<{ [key: string]: string[] }>({});

    const [escolas, setEscolas] = useState<Escolas>({
        id: 0,
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
    const cidadesDisponiveis = escolas.estado ? cidadesPorUf[escolas.estado] || ['Selecione o estado primeiro'] : ['Selecione o estado primeiro'];

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

                const estadosData = await fetchEstados();
                const formattedUfs = estadosData.map(uf => ({ label: uf.nome, value: uf.sigla }));
                setUfs(formattedUfs);

                const municipiosData = await fetchMunicipios('RS');
                const cidadesRS = municipiosData.map(m => m.nome);
                setCidadesPorUf(prev => ({ ...prev, RS: cidadesRS }));

                /** const data = await buscarProfessor();
                 const updatedProfessor = {
                     ...data.objeto,
                     escolas: Array.isArray(data.objeto.escolas) ? data.objeto.escolas : data.objeto.escolas ? [data.objeto.escolas] : [],
                 };
                 setProfessor(updatedProfessor);
                  */
            } catch (error: any) {
                console.error('Erro ao carregar dados iniciais:', error.message);
                if (error.message.includes('401')) {
                    Alert.alert('Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
                    router.push('/auth/login');
                } else {
                    Alert.alert('Erro', 'Não foi possível carregar os dados. Preencha manualmente.');
                    setEscolas((prev) => ({
                        ...prev
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
        setEscolas({ ...escolas, cep: cepClean });

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
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Header title="Cadastro de Escola" onBack={() => router.back()} />
            <View style={styles.group}>
                <InputField
                    label="Nome da Instituição"
                    value={escolas.nomeInstituicao}
                    onChangeText={(text) => setEscolas({ ...escolas, nomeInstituicao: text })}
                    placeholder="Digite o nome da instituição"
                />

                <InputField
                    label="Tipo de Escola"
                    value={escolas.tipo}
                    onChangeText={(text) => setEscolas({ ...escolas, tipo: text as TipoEscola })}
                    placeholder="Informe o tipo de escola"
                    options={[
                        {
                            label: TipoEscola.Publica,
                            value: TipoEscola.Publica,

                        },
                        {
                            label: TipoEscola.Privada,
                            value: TipoEscola.Privada,
                        },
                        {
                            label: TipoEscola.Municipal,
                            value: TipoEscola.Municipal,
                        },
                        {
                            label: TipoEscola.Estadual,
                            value: TipoEscola.Estadual,
                        },
                        {
                            label: TipoEscola.Federal,
                            value: TipoEscola.Federal,
                        },
                    ]}
                />
                <InputField
                    label="CEP"
                    placeholder="Informe o CEP"
                    value={escolas.cep || ''}
                    onChangeText={handleCepChange}
                    editable={!cepLoading}
                    mask="cep"
                />
                {cepLoading && <ActivityIndicator size="small" color={colors.primary} />}
                <InputField
                    label="Estado"
                    placeholder="Informe o estado"
                    options={ufs}
                    selectedValue={escolas.estado || ''}
                    onValueChange={(value) => {
                        const stateValue = value?.toString() || ''; // Garante que seja string
                        setEscolas({ ...escolas, estado: stateValue, cidade: '' });
                        if (stateValue && !cidadesPorUf[stateValue]) {
                            fetchMunicipios(stateValue).then(municipiosData => {
                                const cidades = municipiosData.map(m => m.nome);
                                setCidadesPorUf(prev => ({ ...prev, [stateValue]: cidades }));
                            }).catch(err => console.error('Erro ao carregar cidades:', err));
                        }
                    }}
                />
                <InputField
                    label="Cidade"
                    placeholder="Informe a cidade"
                    options={cidadesDisponiveis.map((cidade) => ({ label: cidade, value: cidade }))}
                    selectedValue={escolas.cidade || ''}
                    onValueChange={(value) => {
                        const cityValue = value?.toString() || ''; // Garante que seja string
                        setEscolas({ ...escolas, cidade: cityValue });
                    }}
                />

                <InputField
                    label="Bairro"
                    placeholder="Digite o bairro"
                    value={escolas.bairro || ''}
                    onChangeText={(value) => setEscolas({ ...escolas, bairro: value })}
                />
                <InputField
                    label="Endereço"
                    placeholder="Digite o endereço"
                    value={escolas.logradouro || ''}
                    onChangeText={(value) => setEscolas({ ...escolas, logradouro: value })}
                />
                <InputField
                    label="Número"
                    placeholder="Digite o número"
                    value={escolas.numero ? escolas.numero.toString() : ''}
                    onChangeText={(value) => {
                        const numValue = value === '' ? 0 : parseInt(value) || 0;
                        setEscolas({ ...escolas, numero: numValue });
                    }}
                />
                <InputField
                    label="Complemento"
                    placeholder="Digite o complemento"
                    value={escolas.complemento || ''}
                    onChangeText={(value) => setEscolas({ ...escolas, complemento: value })}
                />
            </View>
            <View style={styles.button}>
                <CustomButton
                    title="Salvar Cadastro"
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
        padding: 20,
    },
    content: {
        paddingBottom: 100,
        paddingHorizontal: 20,
    },
    group: {
        flex: 1,
        marginBottom: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.greyBlur,
        borderRadius: 8,
    },
    button: {
        alignItems: 'center',
        marginTop: 20,
    },
});
