import { colors, fontSizes } from '../theme/theme'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'

interface LinkButtonProps {
  title: string
  onPress: () => void
}

const LinkButton: React.FC<LinkButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.linkText}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  linkText: {
    color: colors.primary,
    margin: 12,
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_400Regular'
  }
})

export default LinkButton
