// src/components/DataField.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarPlus, X } from 'phosphor-react-native';
import { colors, fontSizes } from '@packages/ui/theme/theme';

interface DataFieldProps {
  label?: string;
  value: string;           // sempre string (nunca undefined)
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function DataField({
  label = 'Dia da Avaliação',
  value = '',              // fallback default para string vazia
  onChange,
  placeholder = 'DD/MM/AAAA',
}: DataFieldProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const webDateInputRef = useRef<HTMLInputElement | null>(null);

  // Valor seguro: nunca undefined
  const safeValue = value ?? '';

  // Máscara para digitação (só aceita números e formata)
  const handleTextChange = (text: string) => {
    let cleaned = (text ?? '').replace(/\D/g, ''); // protege contra undefined
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    onChange(cleaned);
  };

  // Formata Date → DD/MM/YYYY com segurança
  const formatDate = (date?: Date) => {
    if (!date || isNaN(date.getTime())) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Parse DD/MM/YYYY → Date com segurança
  const parseDate = (dateStr?: string): Date | null => {
    const str = dateStr ?? '';
    if (!str || str.length !== 10) return null;
    const [d, m, y] = str.split('/').map(Number);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    const parsed = new Date(y, m - 1, d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const handleNativePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  // Web: abre picker nativo ou fallback
  const openWebPicker = () => {
    const input = webDateInputRef.current;
    if (!input) {
      console.warn('Ref do input date não encontrado');
      return;
    }

    // API moderna (Chrome/Edge 107+)
    if ('showPicker' in input && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (err) {
        console.warn('showPicker falhou:', err);
        if ('click' in input && typeof input.click === 'function') {
          input.click();
        }
      }
      return;
    }

    // Fallback clássico (click)
    if ('click' in input && typeof input.click === 'function') {
      input.click();
    } else {
      console.warn('Método click não disponível no input date');
    }
  };

  // Converte DD/MM/AAAA → YYYY-MM-DD para <input type="date">
  const toWebValue = (dateStr?: string) => {
    const str = dateStr ?? '';
    if (!str || str.length !== 10) return '';
    const [d, m, y] = str.split('/');
    if (!d || !m || !y) return '';
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  // Converte YYYY-MM-DD → DD/MM/AAAA
  const handleWebChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const webValue = e.target.value ?? '';
    if (webValue) {
      const [y, m, d] = webValue.split('-');
      if (d && m && y) {
        onChange(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`);
      }
    } else {
      onChange('');
    }
  };

  const clearValue = () => onChange('');

  const hasValue = !!safeValue && safeValue.length === 10;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>

        <View style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
        ]}>
          <TextInput
            style={styles.inputText}
            value={safeValue}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#adaebc"
            keyboardType="numeric"
            maxLength={10}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <View style={styles.iconWrapper}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openWebPicker}
              style={StyleSheet.absoluteFillObject}
            />
            <CalendarPlus size={24} color={colors.primary} />

            <input
              ref={webDateInputRef}
              type="date"
              value={toWebValue(safeValue)}
              onChange={handleWebChange}
              style={styles.hiddenWebInput}
            />
          </View>
        </View>
      </View>
    );
  }

  // Native (Android/iOS)
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
      ]}>
        <TextInput
          style={styles.inputText}
          value={safeValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor="#adaebc"
          keyboardType="numeric"
          maxLength={10}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {hasValue && (
          <TouchableOpacity onPress={clearValue} style={styles.clearButton}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowDatePicker(true)}
          style={styles.iconButton}
        >
          <CalendarPlus size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={safeValue ? parseDate(safeValue) || new Date() : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleNativePickerChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderColor: colors.secondary,
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputText: {
    flex: 1,
    color: colors.primary,
    fontFamily: 'Nunito_400Regular',
    fontSize: fontSizes.f16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 8,
  },
  iconWrapper: {
    position: 'relative',
    padding: 8,
  },
  iconButton: {
    padding: 8,
  },
  hiddenWebInput: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
});