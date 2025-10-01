// packages/ui/components/CustomButton.tsx
import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator
} from 'react-native'
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import Icon from 'react-native-vector-icons/FontAwesome'

interface CustomButtonProps extends TouchableOpacityProps {
  title: string
  disabled?: boolean
  loading?: boolean
  onPress: () => void
  iconName?: string
  buttonColor?: object
  textColor?: object
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  disabled,
  loading,
  onPress,
  iconName,
  buttonColor,
  textColor,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, buttonColor, disabled && styles.disabled]}
      disabled={disabled || loading}
      {...props}
      onPress={onPress}
    >
      {iconName && (
        <Icon
          name={iconName}
          size={20}
          color={colors.primary}
          style={styles.icon}
        />
      )}

      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10
  },
  disabled: {
    backgroundColor: colors.secondary,
    opacity: 0.6
  },
  text: {
    color: '#ffffff',
    fontSize: fontSizes.lg,
    fontFamily: 'Nunito_400Regular'
  },
  icon: {
    marginRight: 8
  }
})

export default CustomButton
