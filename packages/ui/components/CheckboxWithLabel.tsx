import { colors, fontSizes } from '../theme/theme'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { CheckCircle } from 'phosphor-react-native'

interface CheckboxWithLabelProps {
  label: string
  checked?: boolean
  onPress?: () => void
}

const CheckboxWithLabel: React.FC<CheckboxWithLabelProps> = ({
  label,
  checked = false,
  onPress
}) => {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
       {checked ? (
        <CheckCircle size={20} color={colors.primary} weight="fill" />
      ) : (
        <CheckCircle size={20} color={colors.primary} />
      )}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    flex:1,
    fontSize: fontSizes.f14,
  },
  label: {
    
    color: colors.primary,
    marginLeft: 8, // Restaurando espaçamento original
    
    fontFamily: 'Nunito_400Regular'
  }
})

export default CheckboxWithLabel
