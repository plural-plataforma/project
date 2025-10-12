import { colors } from "@/packages/ui/theme/theme";
import Header from "@src/components/Header";
import CustomButton from "@src/components/CustomButton";
import InputField from "@src/components/InputField";
import SelectButton from "@src/components/SelectButton";
import { useRouter } from "expo-router";
import { CaretRight, User } from "phosphor-react-native";
import { JSX, useState } from "react";
import { FlatList, View, StyleSheet } from "react-native";

export default function Escolas(){
    const router = useRouter();
    const [escolas, setEscolas] = useState([
        { id: 1, name: 'Escola A' },
        { id: 2, name: 'Escola B' },
        { id: 3, name: 'Escola C' },
    ]);

    const renderItems = [
            {
                id: "header",
                component: () => (
                    <Header title="Escolas"  onBack={() => router.back()}/>
                ),
            },
            {
                id: "filter",
                component: () => (
                    <InputField
                        label="Filtro por escola"
                        
                        placeholder="Selecione uma escola"
                    />
                ),
            },
            {
                id: "button",
                component: () => (
                    <CustomButton
                        title="+ Cadastrar Escola"
                        onPress={() => router.push('/escolas/EscolaScreen')} // Exemplo de navegação
                    />
                ),
            },
            {
                id: "listAlunos",
                component: () => (
                    <View>
                        {escolas.map((aluno) => (
                            <SelectButton key={aluno.id} onPress={() => router.push('/escolas/EscolaScreen')} title={aluno.name}
                            iconLeft={<User size={16} color={colors.primary} />}
                            iconRight={<CaretRight  size={16} color={colors.primary} />}
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

    )
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