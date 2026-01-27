import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash } from 'phosphor-react-native';
import { colors, fontSizes } from '@packages/ui/theme/theme';

interface ItemButtonProps {
    escola: string;
    onRemove: (escola: string) => void;
}

const ItemButton: React.FC<ItemButtonProps> = ({ escola, onRemove }) => {
    return (
        <View >
            <TouchableOpacity onPress={() => onRemove(escola)} >
                <View style={styles.card}>
                    <Text style={styles.cardText}>{escola}</Text>
                    <Trash size={20} color={colors.textSecondary} weight="fill" />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container:{
        flex: 1,
       
    },
    card: {
        height: 55,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: colors.primary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        marginBottom: 10,
        marginTop:10
    },
    cardText: {
        color: colors.textSecondary,
        fontSize: fontSizes.f16,
        fontWeight: '500',
        fontFamily: 'Nunito_400Regular',
    },
});

export default ItemButton;