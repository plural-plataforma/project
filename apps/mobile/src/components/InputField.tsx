import { colors, fontSizes } from '../../../../packages/ui/theme/theme';
import { Text, TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import MaskInput, { Masks } from 'react-native-mask-input'; // Importe a biblioteca

interface InputFieldProps extends TextInputProps {
  label: string;
  placeholder?: string;
  options?: { label: string; value: string | number }[]; // Array of options for the dropdown
  onValueChange?: (value: string | number) => void; // Callback for selected value
  selectedValue?: string | number; // Controlled component for selected value
  mask?: 'cep' | 'phone' | 'cpf' | (string | RegExp)[]; // Prop para definir a máscara
  onChangeMaskedText?: (masked: string, raw: string) => void; // Callback para valor mascarado e cru
}

// Máscara personalizada para CPF (999.999.999-99)
const CPF_MASK = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  options,
  onValueChange,
  selectedValue,
  mask,
  onChangeMaskedText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Determina a máscara com base na prop 'mask'
  const getMask = () => {
    switch (mask) {
      case 'cep':
        return Masks.ZIP_CODE; // 99999-999
      case 'phone':
        return Masks.BRL_PHONE; // (99) 99999-9999
      case 'cpf':
        return CPF_MASK; // Máscara personalizada para CPF
      default:
        return mask; // Máscara personalizada como array de RegExp
    }
  };

  if (options && options.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.input, isFocused && styles.inputFocused]}>
          <Picker
            selectedValue={selectedValue}
            onValueChange={(value) => onValueChange && onValueChange(value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={styles.picker}
            dropdownIconColor={colors.primary}
          >
            <Picker.Item label={placeholder || 'Selecione uma opção'} value="" enabled={false} />
            {options.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {mask ? (
        <MaskInput
          value={props.value as string} // Garante que o valor seja string para compatibilidade
          onChangeText={(masked, raw) => {
            if (onChangeMaskedText) {
              onChangeMaskedText(masked, raw); // Passa valor mascarado e cru
            }
            if (props.onChangeText) {
              props.onChangeText(raw); // Passa o valor cru para o estado do componente pai
            }
          }}
          mask={getMask()} // Aplica a máscara escolhida
          placeholder={placeholder}
          placeholderFillCharacter={'_'} // Caractere de preenchimento (opcional)
          style={[styles.input, isFocused && styles.inputFocused]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={props.keyboardType || 'numeric'} // Sugere numérico para máscaras comuns
          {...props}
        />
      ) : (
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
  },
  label: {
    color: colors.primary,
    marginBottom: 5,
    fontSize: fontSizes.f14,
    fontFamily: 'Nunito_400Regular',
    paddingTop: 10,
  },
  input: {
    paddingLeft: 16,
    height: 55,
    color: colors.primary,
    borderColor: colors.secondary,
    borderWidth: 1.5,
    marginRight: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    fontFamily: 'Nunito_400Regular',
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  picker: {
    height: 55,
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
  },
});

export default InputField;