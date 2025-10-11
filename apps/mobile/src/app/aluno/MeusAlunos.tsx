import CustomButton from "@src/components/CustomButton";
import Header from "@src/components/Header";
import InputField from "@src/components/InputField";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import React, { JSX, useState } from "react";
import { colors } from "@/packages/ui/theme/theme";
import SelectButton from "@src/components/SelectButton";
import { Eye, User } from "phosphor-react-native";

export default function MeusAlunos() {
    const router = useRouter();
    const dataEscola = [
        { label: 'Escola A', value: 1 },
        { label: 'Escola B', value: 2 },
        { label: 'Escola C', value: 3 },
    ];

    const [alunos, setAlunos] = useState([
        { id: 1, name: 'Aluno 1', escolaId: 1 },
        { id: 2, name: 'Aluno 2', escolaId: 2 },
        { id: 3, name: 'Aluno 3',  escolaId: 1 },
    ]);

    const [selectedEscola, setSelectedEscola] = useState<number | null>(null);

    const handleEscolaChange = (value: string | number | null) => {
        setSelectedEscola(value as number | null);
        console.log("Escola selecionada:", value); // Para depuração
    };

    const alunosFiltrados = selectedEscola
        ? alunos.filter((aluno) => aluno.escolaId === selectedEscola)
        : alunos;

    // Dados para o FlatList
    const renderItems = [
        {
            id: "header",
            component: () => (
                <Header title="Meus Alunos" onBack={() => router.back()} />
            ),
        },
        {
            id: "filter",
            component: () => (
                <InputField
                    label="Filtro por escola"
                    options={dataEscola}
                    selectedValue={selectedEscola}
                    onValueChange={handleEscolaChange}
                    placeholder="Selecione uma escola"
                />
            ),
        },
        {
            id: "button",
            component: () => (
                <CustomButton
                    title="+ Cadastrar Aluno"
                    onPress={() => router.push('/aluno/AlunoProfileScreen')} // Exemplo de navegação
                />
            ),
        },
        {
            id: "listAlunos",
            component: () => (
                <View>
                    {alunosFiltrados.map((aluno) => (
                        <SelectButton key={aluno.id} onPress={() => router.push('/aluno/AlunoProfileScreen')} title={aluno.name}
                        iconLeft={<User size={16} color={colors.primary} />}
                        iconRight={<Eye size={16} color={colors.primary} />}
                       buttonColor={colors.greyBlur} textColor={colors.primary} borderColor={colors.primary}
                        />
                    ))}
                </View>
            ),
        }
    ];

    const renderItem = ({ item }: { item: { id: string; component: () => JSX.Element } }) => (
        <View key={item.id}>{item.component()}</View>
    );

    return (
        <FlatList
            data={renderItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            style={styles.container}
        />
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        padding: 20,
        
    },
    content: {},
});