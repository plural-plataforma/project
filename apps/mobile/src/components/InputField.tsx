import { colors, fontSizes } from '../../../../packages/ui/theme/theme';
import { Text, TextInput, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useState } from 'react';
import MaskInput, { Masks } from 'react-native-mask-input';
import DropDownPicker from 'react-native-dropdown-picker';
import { CaretDown } from 'phosphor-react-native';

interface InputFieldProps {
  label: string;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  onValueChange?: (value: string | number | null) => void;
  selectedValue?: string | number | null;
  mask?: 'cep' | 'phone' | 'cpf' | (string | RegExp)[];
  onChangeMaskedText?: (masked: string, raw: string) => void;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'number-pad';
  style?: StyleProp<ViewStyle>;
  dropDownContainerStyle?: StyleProp<ViewStyle>;
  openDropdown?: boolean;
  onOpenDropdown?: () => void;
  onFocusTextInput?: () => void;
}

const CPF_MASK = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  options,
  onValueChange,
  selectedValue,
  mask,
  onChangeMaskedText,
  value,
  onChangeText,
  keyboardType,
  style,
  dropDownContainerStyle,
  openDropdown,
  onOpenDropdown,
  onFocusTextInput,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<string | number | null>(selectedValue ?? null);

  const getMask = (): (string | RegExp)[] | undefined => {
    switch (mask) {
      case 'cep':
        return Masks.ZIP_CODE;
      case 'phone':
        return Masks.BRL_PHONE;
      case 'cpf':
        return CPF_MASK;
      default:
        return mask || undefined;
    }
  };

  const handleValueChange = (newValue: string | number | null) => {
    setLocalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  if (options && options.length > 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.label}>{label || ''}</Text>
        <View style={[styles.inputWrapper, isFocused && styles.inputFocused, { overflow: 'visible' }]}>
          <DropDownPicker
            open={openDropdown ?? false}
            value={localValue}
            items={options}
            setOpen={(value) => {
              const nextOpen = typeof value === "function" ? value(openDropdown ?? false) : value;
              if (nextOpen) {
                onOpenDropdown?.(); // Abre
              } else {
                onOpenDropdown?.(); // Fecha (se quiser controle externo)
              }
            }}
            setValue={(callback) => {
              const newValue = typeof callback === 'function' ? callback(localValue) : callback;
              handleValueChange(newValue);
              setOpen(false); // ✅ Fecha dropdown após seleção
              onOpenDropdown?.(); // ✅ Notifica que foi fechado (atualiza estado no pai)
            }}
            placeholder={placeholder || 'Selecione uma opção'}
            onOpen={() => setIsFocused(true)}
            onClose={() => setIsFocused(false)}
            dropDownDirection="AUTO"
            style={styles.dropdown}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              dropDownContainerStyle,
              // já com zIndex apropriado vindo de props
            ]}
            textStyle={[
              styles.dropdownText,
              {
                color:
                  isFocused || localValue
                    ? colors.primary // ✅ Focado ou com valor → cor igual ao TextInput
                    : colors.secondary, // Placeholder
              },
            ]}
            listItemLabelStyle={styles.listItemLabel}
            ArrowDownIconComponent={() => (
              <CaretDown
                size={20}
                color={isFocused ? colors.primary : colors.secondary}
              />
            )}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label || ''}</Text>
      {mask ? (
        <MaskInput
          value={value || ''}
          onChangeText={(masked, raw) => {
            if (onChangeMaskedText) {
              onChangeMaskedText(masked, raw);
            }
            if (onChangeText) {
              onChangeText(raw);
            }
          }}
          mask={getMask()}
          placeholder={placeholder || ''}
          placeholderFillCharacter={'_'}
          style={[styles.input, isFocused && styles.inputFocused]}
          onFocus={() => {
            setIsFocused(true);
            onFocusTextInput?.();
          }}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType || 'numeric'}
          {...props}
        />
      ) : (
        <TextInput
          value={value || ''}
          onChangeText={onChangeText}
          style={[styles.input, isFocused && styles.inputFocused]}
          placeholder={placeholder || ''}
          placeholderTextColor={colors.placeholder}
          onFocus={() => {
            setIsFocused(true);
            onFocusTextInput?.();
          }}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          {...props}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 15,
  },
  label: {
    color: colors.primary,
    marginBottom: 5,
    fontSize: fontSizes.f14,
    fontFamily: 'Nunito_400Regular',
    paddingTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dropdown: {
    flex: 1,
    height: 55,
    borderWidth: 0,
    backgroundColor: colors.background,
  },
  dropdownContainer: {
    backgroundColor: colors.background,
    borderColor: colors.secondary,
    borderWidth: 1.5,
    borderRadius: 8,
    width: '100%',
    elevation: 20,
    maxHeight: 300,
  },
  dropdownText: {
    color: colors.primary,
    fontSize: fontSizes.f16,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'left',
  },
  listItemLabel: {
    fontSize: fontSizes.f16,
    fontFamily: 'Nunito_400Regular',
    paddingVertical: 8,
  },
});

export default InputField;