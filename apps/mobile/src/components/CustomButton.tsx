import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, fontSizes } from '@packages/ui/theme/theme';
import Icon from 'react-native-vector-icons/FontAwesome';

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  iconName?: string;
  buttonColor?: StyleProp<ViewStyle>;   // Estilo customizado (fundo, borda, etc.)
  textColor?: string;                   // Cor do texto quando habilitado
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  disabled = false,
  loading = false,
  onPress,
  iconName,
  buttonColor,
  textColor = colors.textSecondary,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonColor,                    // aplica estilo customizado se passado
        isDisabled && styles.disabled,  // opacity + fundo alterado SOMENTE quando disabled
        props.style,
      ]}
      disabled={isDisabled}             // bloqueia clique
      activeOpacity={isDisabled ? 1 : 0.7} // não escurece ao tocar quando desabilitado
      onPress={onPress}
      {...props}
    >
      {iconName && (
        <Icon
          name={iconName}
          size={20}
          color={isDisabled ? colors.textMuted : colors.primary}
          style={styles.icon}
        />
      )}

      {loading ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <Text
          style={[
            styles.text,
            { color:  textColor },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.6,                    // ← Aplica OPACITY apenas quando disabled=true
    backgroundColor: colors.primary2, // fundo alterado (opcional, pode remover se não quiser)
  },
  text: {
    fontSize: fontSizes.f18,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
  icon: {
    marginRight: 12,
  },
});

export default CustomButton;