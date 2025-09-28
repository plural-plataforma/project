import { colors, fontSizes } from '../theme/theme'
import { Text, TextInput, View, StyleSheet, TextInputProps } from 'react-native'

interface InputFieldProps extends TextInputProps {
  label: string
  placeholder: string
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 0,
    padding: 0,
    marginBottom: 8
  },
  label: {
    color: colors.primary,
    marginHorizontal: 12,
<<<<<<< HEAD
=======
    marginBottom: 4,
>>>>>>> 51fe25d65a4986d951f44b633b0b17e73155ce4d
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_400Regular'
  },
  input: {
    paddingLeft: 16,
    height: 55,
    width: '90%',
    color: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
<<<<<<< HEAD
    marginHorizontal: 12, // mantém só a margem lateral
=======
    marginHorizontal: 12,
    margin: 12,
>>>>>>> 51fe25d65a4986d951f44b633b0b17e73155ce4d
    borderRadius: 8,
    fontFamily: 'Nunito_400Regular'
  }
})

export default InputField
