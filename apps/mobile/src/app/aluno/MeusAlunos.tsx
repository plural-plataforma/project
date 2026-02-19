import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import InputField from "@src/components/InputField";
import { useRouter } from "expo-router";
// NOVO: Importe useFocusEffect do React Navigation
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, StyleSheet, View, Text, ActivityIndicator, RefreshControl } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { colors } from "@packages/ui/theme/theme";
import SelectButton from "@src/components/SelectButton";
import { Eye, User } from "phosphor-react-native";
import { buscarEscolasProfessor } from "@src/services/professorService";
import { buscarAlunos } from '@src/services/alunoService';

export default function MeusAlunos() {
    const router = useRouter();
    const [escolasOptions, setEscolasOptions] = useState<{ label: string; value: number }[]>([]);
    const [alunos, setAlunos] = useState<{ id: number; name: string; escolaId: number | number[] }[]>([]);
    const [loadingAlunos, setLoadingAlunos] = useState(true);
    const [loadingEscolas, setLoadingEscolas] = useState(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [selectedEscola, setSelectedEscola] = useState<number | null>(null);

    // NOVO: Função unificada para carregar dados (escolas e alunos), com flag para mensagens
    const fetchData = useCallback(async (showMsg = true) => {
        try {
            setLoadingEscolas(true);
            const escolas = await buscarEscolasProfessor();
            const opts = escolas
                .filter((e) => e.id != null)
                .map((e) => ({
                    label: (e.nomeInstituicao || `Escola ${e.id}`),
                    value: e.id as number,
                }));
            setEscolasOptions(opts);

            setLoadingAlunos(true);
            const data = await buscarAlunos();
            const mapped = data.map((a, idx) => {
                const raw = a as any;
                const id = raw.id != null ? Number(raw.id) : idx + 1;
                const name = raw.nomeCompleto || raw.nome || `Aluno ${id}`;
                // FIX: Corrigido para raw.idEscola (conforme JSON da API)
                const escolaId = raw.escolas != null ? Number(raw.escolas) : (raw.idEscola != null ? Number(raw.idEscola) : 0);
                return { id, name, escolaId };
            });
            setAlunos(mapped);
        } catch (err) {
            console.error('❌ Erro ao carregar dados:', err);
            if (showMsg) {
                // Opcional: Adicione useCustomAlert aqui se quiser alerts como em Escolas
                // const { showAlert } = useCustomAlert();
                // showAlert('Erro', 'Não foi possível carregar os alunos/escolas. Tente novamente.');
            }
        } finally {
            setLoadingEscolas(false);
            setLoadingAlunos(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // NOVO: Hook para refresh automático ao ganhar foco (ex.: voltar da AlunoProfileScreen)
    useFocusEffect(
        useCallback(() => {
            // Chama fetchData silenciosamente (showMsg=false) para evitar alerts
            fetchData(false);
        }, [fetchData])
    );

    // NOVO: Função para pull-to-refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(false).finally(() => setRefreshing(false));
    }, [fetchData]);

    const handleEscolaChange = (value: string | number | null) => {
        // FIX: Converte para number para evitar mismatch com escolaId (number)
        setSelectedEscola(value ? Number(value) : null);
    };

    const clearFilter = () => {
        // FIX: Limpa o filtro e força re-render da lista (seta null explicitamente)
        setSelectedEscola(null);
    };

    const alunosFiltrados = selectedEscola
        ? alunos.filter((aluno) => {
            if (Array.isArray(aluno.escolaId)) {
                return aluno.escolaId.includes(selectedEscola);
            }
            return aluno.escolaId === selectedEscola;
        })
        : alunos;

    const renderAluno = useCallback(({ item }: { item: { id: number; name: string } }) => (
        <SelectButton
            onPress={() => router.push({ pathname: '/aluno/AlunoProfileScreen', params: { id: item.id } })}
            title={item.name}
            iconLeft={<User size={16} color={colors.primary} />}
            iconRight={<Eye size={16} color={colors.primary} />}
            buttonColor={colors.greyBlur}
            textColor={colors.primary}
            borderColor={colors.primary}
        />
    ), [router]);

    const isLoading = loadingAlunos || loadingEscolas;

    return (
        <View style={styles.container}>
            <Header title="Meus Alunos" onBack={() => router.back()} fixed={true} />
            <View style={styles.fixedHeader}>
                <View style={styles.filterContainer}>
                    <InputField
                        label="Filtro por escola"
                        options={escolasOptions}
                        selectedValue={selectedEscola}
                        onValueChange={handleEscolaChange}
                        placeholder="Selecione uma escola"
                        style={{ flex: 1 }}
                    />
                    {selectedEscola && (
                        <CustomButton
                            title="Limpar"
                            onPress={clearFilter}
                            buttonColor={{ backgroundColor: colors.primary, marginLeft: 10, alignSelf: 'center' }}
                        />
                    )}
                </View>
                <CustomButton
                    title="+ Cadastrar Aluno"
                    onPress={() => router.push('/aluno/AlunoProfileScreen')}
                />
            </View>

            <FlatList
                data={alunosFiltrados}
                renderItem={renderAluno}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.content}
                style={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} /> : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop: 90
    },
    fixedHeader: { 
        marginBottom: 10,
    },
    content: {
        paddingBottom: 20,
    },
    list: {
        flex: 1,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.secondary,
    },
});