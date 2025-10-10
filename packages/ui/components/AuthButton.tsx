import { colors, fontSizes } from '../theme/theme'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'

interface AuthButtonProps {
  title: string
  onPress: () => void
  iconName?: string
  isGoogle?: boolean
}

const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  iconName,
  isGoogle = false
}) => {
  const buttonStyle = isGoogle
    ? [styles.button, styles.googleButton]
    : styles.button
  const textStyle = isGoogle ? styles.googleButtonText : styles.buttonText

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress}>
      {iconName && (
        <Icon
          name={iconName}
          size={20}
          color={colors.primary}
          style={styles.icon}
        />
      )}
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 12,
    marginRight: 12,
    backgroundColor: colors.primary2,
    height: 55,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row'
  },
  googleButton: {
    backgroundColor: '#fff',
    width: '40%',
    height: 40,
    borderWidth: 1,
    borderColor: colors.primary
  },
  icon: {
    marginRight: 8
  },
  buttonText: {
    color: colors.background,
    fontSize: fontSizes.f10,
    fontFamily: 'Nunito_700Bold'
  },
  googleButtonText: {
    color: colors.primary,
    fontSize: fontSizes.f10,
    fontFamily: 'Nunito_700Bold'
  }
})

export default AuthButton
