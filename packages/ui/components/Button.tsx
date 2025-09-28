import { colors, fontSizes } from '../theme/theme'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'

interface ButtonProps {
  title: string
  onPress: () => void
  iconName?: string
  buttonColor?: object
  textColor?: object
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  iconName,
  buttonColor,
  textColor,
  ...props
}) => {
  return (
    <TouchableOpacity style={[styles.button, buttonColor]} onPress={onPress}>
      {iconName && (
        <Icon
          name={iconName}
          size={20}
          color={colors.primary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.buttonText, textColor]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 12,
    marginRight: 12,
    height: 55,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row'
  },
  icon: {
    marginRight: 8
  },
  buttonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_700Bold'
  }
})

export default Button
