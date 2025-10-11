import { colors, fontSizes } from '../../../../packages/ui/theme/theme';
import { Text, TextInput, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useState, useRef, useCallback } from 'react';
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
}

const CPF_MASK = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];

// Contador global para zIndex único
let zIndexCounter = 100000;

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
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<string | number | null>(selectedValue ?? null);
  const zIndexRef = useRef(zIndexCounter--); // Gera um zIndex único e decrescente

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

  const handleValueChange = useCallback((newValue: string | number | null) => {
    setLocalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
    setOpen(false); // Fecha o dropdown após seleção
  }, [onValueChange]);

  const handleFocusTextInput = useCallback(() => {
    setOpen(false); // Fecha o dropdown ao focar em um TextInput
  }, []);

  if (options && options.length > 0) {
    return (
      <View style={[styles.container, style, { position: 'relative', zIndex: zIndexRef.current - 100, overflow: 'visible' }]}>
        <Text style={styles.label}>{label || ''}</Text>
        <View style={[styles.inputWrapper, isFocused && styles.inputFocused, { overflow: 'visible' }]}>
          <DropDownPicker
            open={open}
            value={localValue}
            items={options}
            setOpen={setOpen}
            setValue={(callback) => {
              const newValue = typeof callback === 'function' ? callback(localValue) : callback;
              if (newValue === null || typeof newValue === 'string' || typeof newValue === 'number') {
                handleValueChange(newValue);
              }
            }}
            placeholder={placeholder || 'Selecione uma opção'}
            onOpen={() => setIsFocused(true)}
            onClose={() => setIsFocused(false)}
            dropDownDirection="AUTO"
            style={styles.dropdown}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              dropDownContainerStyle,
              {
                zIndex: zIndexRef.current,
                elevation: 1000,
                position: 'absolute',
                top: 55,
              },
            ]}
            textStyle={[
              styles.dropdownText,
              { color: isFocused || localValue ? colors.primary : colors.secondary },
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
            handleFocusTextInput();
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
            handleFocusTextInput();
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