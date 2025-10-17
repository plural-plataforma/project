import { colors, fontSizes } from '@/packages/ui/theme/theme';
import { Text, TextInput, View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import MaskInput, { Masks } from 'react-native-mask-input';
import DropDownPicker from 'react-native-dropdown-picker';
import { CaretDown, X } from 'phosphor-react-native';
import { Eye, EyeSlash } from 'phosphor-react-native'

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
  editable?: boolean;
  [key: string]: any; // Para aceitar outras props do TextInput
  error?: string;
}

const CPF_MASK = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];

// Contador global para zIndex único e crescente
let zIndexCounter = 1000;

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
  editable = true,
  error,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<string | number | null>(selectedValue ?? null);
  const [showPassword, setShowPassword] = useState(false);
  const zIndex = useRef<number>(zIndexCounter++).current;

  const {
    secureTextEntry: isSecure,
    ...inputProps
  } = props;

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

  // Componente para Web: usa <select> nativo
  const WebSelect = () => {
    const selectRef = useRef<HTMLSelectElement>(null);
    const selectColor = isFocused || localValue ? colors.primary : colors.secondary;
    const handlePress = () => {
      if (selectRef.current && editable) {
        selectRef.current.click();
        selectRef.current.focus();
      }
    };

    return (
      <TouchableOpacity
        style={[styles.inputWrapper, isFocused && styles.inputFocused]}
        onPress={handlePress}
        disabled={!editable}
        activeOpacity={1}
      >
        <select
          ref={selectRef}
          value={localValue?.toString() || ''}
          onChange={(e) => handleValueChange(e.target.value || null)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            ...styles.webSelect,
            color: selectColor,
          }}
        >
          <option value="" disabled>
            {placeholder || 'Selecione uma opção'}
          </option>
          {options?.map((option) => (
            <option key={option.value.toString()} value={option.value.toString()}>
              {option.label}
            </option>
          ))}
        </select>
        <CaretDown
          size={20}
          color={isFocused ? colors.primary : colors.secondary}
          style={styles.webSelectIcon}
        />
      </TouchableOpacity>
    );
  };

  if (options && options.length > 0) {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.container, style]}>
          <Text style={styles.label}>{label || ''}</Text>
          <WebSelect />
        </View>
      );
    }

    return (
      <View style={[styles.container, style, { position: 'relative', zIndex, overflow: 'visible' }]}>
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
            flatListProps={{
              keyboardShouldPersistTaps: 'always',
              initialNumToRender: 20,
              nestedScrollEnabled: true,
              scrollEnabled: true,
            }}
            placeholder={placeholder || 'Selecione uma opção'}
            onOpen={() => setIsFocused(true)}
            onClose={() => setIsFocused(false)}
            listMode="FLATLIST"
            dropDownContainerStyle={{
              zIndex: zIndex + 1,
              maxHeight: 300,
            }}
            style={{ flex: 1 }}
            textStyle={[
              styles.dropdownText,
              { color: isFocused || localValue ? colors.primary : colors.secondary },
            ]}
            listItemLabelStyle={styles.listItemLabel}
            ArrowDownIconComponent={() => (
              <CaretDown size={20} color={isFocused ? colors.primary : colors.secondary} />
            )}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
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
        <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
          <TextInput
            value={value || ''}
            onChangeText={onChangeText}
            style={styles.inputText}
            placeholder={placeholder || ''}
            placeholderTextColor={colors.placeholder}
            secureTextEntry={isSecure ? !showPassword : false}
            onFocus={() => {
              setIsFocused(true);
              handleFocusTextInput();
            }}
            onBlur={() => setIsFocused(false)}
            keyboardType={keyboardType}
            editable={editable}
            {...inputProps}
          />

          {isSecure && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.togglePasswordContainer}>
              {showPassword ? (
                <EyeSlash size={20} color={colors.primary} />
              ) : (
                <Eye size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: colors.primary,
    marginBottom: 6,
    fontSize: fontSizes.f14,
    fontFamily: 'Nunito_400Regular',
  },

  input: {
    paddingLeft: 16,
    height: 55,
    color: colors.primary,
    borderColor: colors.secondary,
    borderWidth: 1.5,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderColor: colors.secondary,
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    marginBottom: 5,
  },

  inputText: {
    flex: 1,
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
    fontSize: fontSizes.f16,
    paddingVertical: 0,

  },

  togglePasswordContainer: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  // Novos estilos para Web
  webSelect: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: fontSizes.f16,
    fontFamily: 'Nunito_400Regular',
    color: colors.primary,
    paddingVertical: 0,
    ...(Platform.OS === 'web' && {
      appearance: 'none' as const,
      WebkitAppearance: 'none' as const,
    }),
  },
  webSelectIcon: {
    marginLeft: 8,
    // No Web, o ícone fica ao lado para simular a seta
  },
  errorText: {
  color: 'red',
  fontSize: fontSizes.f12,
  marginTop: 4,
  fontFamily: 'Nunito_400Regular',
},
});

export default InputField;