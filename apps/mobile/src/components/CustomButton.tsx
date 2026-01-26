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
      style={[styles.button, buttonColor, disabled && styles.disabled, props.style,]}
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    flexDirection: 'row'
  },
  disabled: {
    backgroundColor: colors.primary2,
    opacity: 0.6
  },
  text: {
    color: '#ffffff',
    fontSize: fontSizes.f18,
    fontFamily: 'Nunito_700Bold',     
    textAlign: 'center',
  },
  icon: {
    marginRight: 8
  }
})

export default CustomButton
