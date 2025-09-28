import { colors, fontSizes } from '../theme/theme'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'

interface SignupLinkProps {
  onPress: () => void
}

const SignupLink: React.FC<SignupLinkProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Não tem uma conta?{' '}
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.link}>Inscreva-se</Text>
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
