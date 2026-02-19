import React, { useMemo, useState } from 'react'
import {
    View,
    Text,
    FlatList,
    Pressable,
    StyleSheet,
} from 'react-native'
import { CheckSquare, Square, User } from 'phosphor-react-native'

import InputField from '@src/components/InputField'
import { colors } from '@packages/ui/theme/theme'
import { Aluno } from '@src/types/aluno'
import { Escola } from '@src/types/escolas'

interface AlunoSelectionProps {
    alunos: Aluno[]
    escolas: Escola[]
    selectedAlunos: Aluno[]
    onToggleAluno: (aluno: Aluno) => void
}

const AlunoSelection: React.FC<AlunoSelectionProps> = ({
    alunos,
    escolas,
    selectedAlunos,
    onToggleAluno,
}) => {
    const [search, setSearch] = useState('')
    const [selectedEscolaId, setSelectedEscolaId] = useState<string | null>('')

    const escolaOptions = useMemo(() => {
        return [
            { label: 'Todas as escolas', value: '' },
            ...escolas.map(e => ({
                label: e.nomeInstituicao,
                value: String(e.id),
            })),
        ]
    }, [escolas])

    const filteredAlunos = useMemo(() => {
        return alunos.filter(a => {
            const matchName =
                search === '' ||
                a.nomeCompleto.toLowerCase().includes(search.toLowerCase())

            const matchSchool =
                selectedEscolaId === '' ||
                selectedEscolaId === null ||
                String(a.idEscola) === selectedEscolaId

            return matchName && matchSchool
        })
    }, [alunos, search, selectedEscolaId])

    const renderItem = ({ item }: { item: Aluno }) => {
        const selected = selectedAlunos.some(a => a.id === item.id)

        return (
            <Pressable
                style={[
                    styles.item,
                    selected && styles.itemSelected,
                ]}
                onPress={() => onToggleAluno(item)}
            >
                <User size={24} color={colors.primary} />

                <Text style={styles.itemText} numberOfLines={2}>
                    {item.nomeCompleto}
                </Text>

                {selected ? (
                    <CheckSquare size={28} color={colors.primary} weight="fill" />
                ) : (
                    <Square size={28} color={colors.primary} />
                )}
            </Pressable>
        )
    }

    return (
        <View>
            {/* Filtro por escola */}
            <View style={styles.label}>
                <InputField
                    label='Filtrar por escola'
                    placeholder="Selecione..."
                    value={selectedEscolaId ?? ''}
                    options={escolaOptions}
                    onValueChange={value =>
                        setSelectedEscolaId(value ? String(value) : '')
                    }
                    dropDownContainerStyle={{ maxHeight: 500 }}
                />

            </View>
            {/* Buscar aluno (mantido ✅) */}
            <InputField
                label="Buscar aluno"
                placeholder="Nome do aluno"
                value={search}
                onChangeText={setSearch}
                style={{ marginTop: 16 }}
            />

            <FlatList
                data={filteredAlunos}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={{ paddingTop: 12 }}
                scrollEnabled={false}
                ListEmptyComponent={
                    <Text style={styles.empty}>Nenhum aluno encontrado</Text>
                }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: colors.primary,
        marginTop: 24,
        marginBottom: 8,
    },

    item: {
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(39,102,120,0.42)',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    itemSelected: {
        borderWidth: 2,
        borderColor: colors.primary,
    },

    itemText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: colors.primary,
    },

    empty: {
        textAlign: 'center',
        padding: 20,
        color: '#999',
    },
})

export default AlunoSelection
