// src/screens/avaliacao-diagnostica/criacao/step1-identificacao.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import ProgressFill from '@src/components/ProgressFill';
import InputField from '@src/components/InputField';
import CustomButton from '@src/components/CustomButton';
import { colors } from '@packages/ui/theme/theme';
import { ArrowLeft, Calendar } from 'phosphor-react-native';
import { useProgress } from './context/ProgressContext';

export default function Step1Identificacao() {
  const router = useRouter();
  const { currentStep, totalSteps, goToNext } = useProgress();

  const [titulo, setTitulo] = useState('');
  const [resumo, setResumo] = useState('');
  const [dataAvaliacao, setDataAvaliacao] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Debug: log sempre que os campos mudarem
  useEffect(() => {
    console.log('DEBUG - isFormValid:', titulo.trim().length > 0 && dataAvaliacao !== null);
    console.log('DEBUG - titulo:', titulo);
    console.log('DEBUG - dataAvaliacao:', dataAvaliacao);
  }, [titulo, dataAvaliacao]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDataAvaliacao(selectedDate);
    }
  };

  const isFormValid = titulo.trim().length > 0 && dataAvaliacao !== null;

  const handleProximaEtapa = () => {
    if (isFormValid) {
      goToNext();
      router.push('/avaliacaoDiagnostica/criacao/step2-alunos');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliação Diagnóstica</Text>
        </View>

        {/* Progresso */}
        <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

        {/* Título da etapa */}
        <Text style={styles.sectionTitle}>Identificação da Avaliação</Text>

        {/* Campo Nome */}
        <InputField
          label="Nome da Avaliação"
          placeholder="Ex: Diagnóstico Janeiro 2026"
          value={titulo}
          onChangeText={setTitulo}
          containerStyle={styles.inputContainer}
        />

        {/* Campo Data */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowDatePicker(true)}
        >
          <InputField
            label="Data da Avaliação"
            placeholder="DD/MM/AAAA"
            value={formatDate(dataAvaliacao)}
            editable={false}
            rightIcon={<Calendar size={20} color={colors.primary} />}
            containerStyle={styles.inputContainer}
          />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dataAvaliacao || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Campo Resumo */}
        <InputField
          label="O que deseja buscar na avaliação"
          placeholder="Resumo / Objetivo da avaliação"
          value={resumo}
          onChangeText={setResumo}
          multiline
          numberOfLines={4}
          containerStyle={[styles.inputContainer, styles.textArea]}
        />

        {/* Botão Próxima Etapa - sempre visível, mas cor muda */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Próxima Etapa"
            onPress={handleProximaEtapa}
            disabled={!isFormValid}               // só isso controla opacity + bloqueio de clique
            buttonColor={ { backgroundColor: colors.primary2 }}
            textColor={colors.textSecondary}
          />
        </View> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Aumentado para garantir que o botão fique visível
    minHeight: '100%',  // Força o conteúdo a ocupar tela cheia
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 16,

  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 32,
    paddingTop: 20,
    textAlign: 'center', // Centralizado como pedido
  },
  inputContainer: {
    marginBottom: 24,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 40,
  },
  nextButton: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 12,
    paddingVertical: 14,
  },
});