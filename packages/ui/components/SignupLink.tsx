import { colors, fontSizes } from '../theme/theme'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'

interface SignupLinkProps {
  onPress: () => void
  labelQuestion?: string
  labelAction?: string
}

const SignupLink: React.FC<SignupLinkProps> = ({
  onPress,
  labelQuestion,
  labelAction
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {labelQuestion}{' '}
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.link}>{labelAction}</Text>
        </TouchableOpacity>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20
  },
  text: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: 'Nunito_400Regular'
  },
  link: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  }
})

export default SignupLink
