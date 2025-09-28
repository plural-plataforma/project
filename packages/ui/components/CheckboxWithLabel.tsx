import { colors, fontSizes } from '../theme/theme'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import { CheckCircle } from 'phosphor-react-native'

interface CheckboxWithLabelProps {
  label: string
  onPress?: () => void
}

const CheckboxWithLabel: React.FC<CheckboxWithLabelProps> = ({
  label,
  onPress
}) => {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
      <CheckCircle size={20} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12
  },
  label: {
    color: colors.primary,
    marginLeft: 8, // Restaurando espaçamento original
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_400Regular'
  }
})

export default CheckboxWithLabel
