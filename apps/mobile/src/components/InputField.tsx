import { colors, fontSizes } from '../../../../packages/ui/theme/theme'
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
      <View style={styles.groupInput}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={'#ADAEBC'}
        {...props}
      />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    
  },
  groupInput:
  {
    width: "100%",
    marginHorizontal: 8,
    flex: 1
  },
  label: {
    color: colors.primary,
    marginBottom: 10,
    fontSize: fontSizes.f14,
    fontFamily: 'Nunito_400Regular',
    paddingTop:10
  },
  input: {
    paddingLeft: 16,
    height: 55,
    color: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    marginRight: 10,

    borderRadius: 8,
    fontFamily: 'Nunito_400Regular'
  }
})

export default InputField
