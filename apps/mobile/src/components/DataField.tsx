// src/components/DataField.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarPlus, X } from 'phosphor-react-native';
import { colors, fontSizes } from '@packages/ui/theme/theme';

interface DataFieldProps {
  label?: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function DataField({
  label = 'Dia da Avaliação',
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
}: DataFieldProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const webDateInputRef = useRef<HTMLInputElement>(null);

  // Máscara para digitação
  const handleTextChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    onChange(cleaned);
  };

  const handleNativePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Abre picker no web (compatibilidade máxima)
  const openWebPicker = () => {
    if (webDateInputRef.current) {
      if ('showPicker' in webDateInputRef.current && typeof webDateInputRef.current.showPicker === 'function') {
        (webDateInputRef.current as any).showPicker();
      } else {
        webDateInputRef.current.click();
      }
    }
  };

  // Converte DD/MM/AAAA → YYYY-MM-DD
  const toWebValue = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return '';
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  // Converte YYYY-MM-DD → DD/MM/AAAA
  const handleWebChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const webValue = e.target.value;
    if (webValue) {
      const [y, m, d] = webValue.split('-');
      onChange(`${d}/${m}/${y}`);
    } else {
      onChange('');
    }
  };

  const clearValue = () => onChange('');

  const hasValue = value && value.length === 10;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>

        <View style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
        ]}>
          {/* Campo visual + digitação (totalmente clicável) */}
          <TextInput
            style={styles.inputText}
            value={value}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#adaebc"
            keyboardType="numeric"
            maxLength={10}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {/* Área do ícone com overlay hidden input (só no ícone) */}
          <View style={styles.iconWrapper}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openWebPicker}
              style={StyleSheet.absoluteFillObject}
            />
            <CalendarPlus size={24} color={colors.primary} />

            {/* Hidden input overlay só no ícone */}
            <input
              ref={webDateInputRef}
              type="date"
              value={toWebValue(value)}
              onChange={handleWebChange}
              style={styles.hiddenWebInput}
            />
          </View>
        </View>
      </View>
    );
  }

  // Native
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
      ]}>
        <TextInput
          style={styles.inputText}
          value={value}
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
          value={value ? parseDate(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleNativePickerChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

const parseDate = (dateStr: string): Date => {
  const [d, m, y] = dateStr.split('/').map(Number);
  return new Date(y, m - 1, d);
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