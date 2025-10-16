import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import InputField from "@src/components/InputField";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View, Text, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";
import { colors } from "@/packages/ui/theme/theme";
import SelectButton from "@src/components/SelectButton";
import { Eye, User } from "phosphor-react-native";
import { buscarEscolasProfessor } from "@src/services/professorService";
import { buscarAlunos } from '@src/services/alunoService';

export default function MeusAlunos() {
    const router = useRouter();
    const [escolasOptions, setEscolasOptions] = useState<{ label: string; value: number }[]>([]);
    const [alunos, setAlunos] = useState<{ id: number; name: string; escolaId: number | number[] }[]>([]);
    const [loadingAlunos, setLoadingAlunos] = useState(true);
    const [selectedEscola, setSelectedEscola] = useState<number | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const escolas = await buscarEscolasProfessor();
                if (!mounted) return;
                const opts = escolas
                    .filter((e) => e.id != null)
                    .map((e) => ({
                        label: (e.nomeInstituicao || `Escola ${e.id}`),
                        value: e.id as number,
                    }));
                setEscolasOptions(opts);
            } catch (err) {
                console.error('Erro ao carregar escolas:', err);
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        let mounted = true;
        setLoadingAlunos(true);
        (async () => {
            try {
                const data = await buscarAlunos();
                if (!mounted) return;
                const mapped = data.map((a, idx) => {
                    const raw = a as any;
                    const id = raw.id != null ? Number(raw.id) : idx + 1;
                    const name = raw.nomeCompleto || raw.nome || `Aluno ${id}`;
                    const escolaId = raw.escolas != null ? Number(raw.escolas) : (raw.escolaId != null ? Number(raw.escolaId) : 0);
                    return { id, name, escolaId };
                });
                setAlunos(mapped);
            } catch (err) {
                console.error('Erro ao carregar alunos:', err);
            } finally {
                if (mounted) setLoadingAlunos(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleEscolaChange = (value: string | number | null) => {
        setSelectedEscola(value as number | null);
    };

    const clearFilter = () => {
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

    const renderAluno = ({ item }: { item: { id: number; name: string } }) => (
        <SelectButton
            key={item.id}
            onPress={() => router.push('/aluno/AlunoProfileScreen')} // Idealmente, passar o ID do aluno: `/aluno/${item.id}`
            title={item.name}
            iconLeft={<User size={16} color={colors.primary} />}
            iconRight={<Eye size={16} color={colors.primary} />}
            buttonColor={colors.greyBlur}
            textColor={colors.primary}
            borderColor={colors.primary}
        />
    );

    return (
        <View style={styles.container}>
            <Header title="Meus Alunos" onBack={() => router.back()} />
            <FlatList
                data={alunosFiltrados}
                renderItem={renderAluno}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.content}
                ListHeaderComponent={
                    <View>
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
                                    buttonColor={{ backgroundColor: colors.danger, marginLeft: 10, alignSelf: 'flex-end' }}
                                />
                            )}
                        </View>
                        <CustomButton
                            title="+ Cadastrar Aluno"
                            onPress={() => router.push('/aluno/AlunoProfileScreen')}
                        />
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderText}>Alunos</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    !loadingAlunos ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    loadingAlunos ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} /> : null
                }
            />
        </View>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
    },
    content: {
        paddingBottom: 20,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    listHeader: {
        marginTop: 20,
        marginBottom: 10,
    },
    listHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
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