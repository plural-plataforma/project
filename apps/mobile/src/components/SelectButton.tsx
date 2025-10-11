import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    TouchableOpacityProps,
    ActivityIndicator,
    View,
} from 'react-native';

interface SelectButtonProps extends TouchableOpacityProps {
    title: string;
    disabled?: boolean;
    loading?: boolean;
    onPress: () => void;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    buttonColor?: string;
    textColor?: string;
    borderColor?: string;
}

const SelectButton: React.FC<SelectButtonProps> = ({
    title,
    disabled,
    loading,
    onPress,
    iconLeft,
    iconRight,
    buttonColor = '#4A90E2',
    textColor = '#FFFFFF',
    borderColor = 'transparent',
    ...props
}) => {
    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }, disabled && styles.disabled, borderColor !== 'transparent' && { borderWidth: 1, borderColor }]}
            disabled={disabled || loading}
            {...props}
            onPress={onPress}
        >
            {iconLeft && (
                <View style={styles.iconLeft}>{iconLeft}</View>
            )}
            {loading ? (
                <ActivityIndicator size="small" color={textColor} />
            ) : (
                <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            )}
            {iconRight && (
                <View style={styles.iconRight}>{iconRight}</View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
        flexDirection: 'row',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
    },

    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginRight: 8,
        marginLeft: 'auto',
    },
});

export default SelectButton;