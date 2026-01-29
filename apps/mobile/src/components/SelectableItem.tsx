import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fontSizes } from '@packages/ui/theme/theme'
import { CheckSquare, Square } from 'phosphor-react-native'

interface SelectableItemProps {
  label: string
  selected: boolean
  onPress: () => void
  disabled?: boolean

  /** Ícone opcional à esquerda */
  LeftIcon?: React.ReactNode

  /** Sobrescrever estilos se precisar */
  containerStyle?: any
  textStyle?: any
}

const SelectableItem: React.FC<SelectableItemProps> = ({
  label,
  selected,
  onPress,
  disabled = false,
  LeftIcon,
  containerStyle,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
        containerStyle,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {LeftIcon && <View style={styles.iconLeft}>{LeftIcon}</View>}

      <Text
        style={[
          styles.text,
          disabled && styles.textDisabled,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {selected ? (
        <CheckSquare size={26} color={colors.primary} weight="fill" />
      ) : (
        <Square size={26} color={colors.primary} />
      )}
    </TouchableOpacity>
  )
}

export default React.memo(SelectableItem)

const styles = StyleSheet.create({
  container: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(39,102,120,0.42)',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#EAF6FA',
  },
  disabled: {
    opacity: 0.5,
  },
  iconLeft: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: fontSizes.f16,
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
  },
  textDisabled: {
    color: '#999',
  },
})
