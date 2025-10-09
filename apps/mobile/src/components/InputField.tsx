import { colors, fontSizes } from '../../../../packages/ui/theme/theme';
import { Text, TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';

interface InputFieldProps extends TextInputProps {
  label: string;
  placeholder?: string;
  options?: { label: string; value: string | number }[]; // Array of options for the dropdown
  onValueChange?: (value: string | number) => void; // Callback for selected value
  selectedValue?: string | number; // Controlled component for selected value
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  options,
  onValueChange,
  selectedValue,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

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
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
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