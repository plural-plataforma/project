// src/screens/avaliacao-diagnostica/criacao/step1-identificacao.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import ProgressFill from '@src/components/ProgressFill';
import InputField from '@src/components/InputField';
import CustomButton from '@src/components/CustomButton';
import Header from '@src/components/Header';
import WizardScrollView from '@src/components/WizardScrollView';
import { colors } from '@packages/ui/theme/theme';
import { Calendar, CalendarPlus } from 'phosphor-react-native';
import { useProgress } from './context/ProgressContext';
import { Platform } from 'react-native';
import DataField from '@src/components/DataField';
import { useCreation } from './context/CreationContext';
import { Escola } from '@src/types/escolas';
import { buscarEscolas } from '@src/services/escolasService';

export default function Step1Identificacao() {
  const router = useRouter();
  const { currentStep, totalSteps } = useProgress();
  const { data, updateData } = useCreation();

  const { startCreation, isEditing, isLoading } = useCreation();
  useEffect(() => {
    if (!isEditing) {
      startCreation();
    }
  }, [isEditing]);

  const isFormValid =
    data.titulo.trim().length > 0 &&
    data.dataAplicacao.length === 10

  const handleProximaEtapa = () => {
    if (isFormValid) {
      router.push('/avaliacaoDiagnostica/criacao/step2-alunos');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Avaliação Diagnóstica" fixed />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header fixo no topo */}
      <Header title="Avaliação Diagnóstica" fixed />

      {/* Conteúdo rolável - começa abaixo do header */}
      <WizardScrollView>
        {/* Progresso */}
        <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

        {/* Título da etapa */}
        <Text style={styles.sectionTitle}>Identificação da Avaliação</Text>

        {/* Campo Nome */}
        <InputField
          label="Nome da Avaliação"
          placeholder="Ex: Diagnóstico Janeiro 2026"
          value={data.titulo}
          onChangeText={(t) => updateData({ titulo: t })}
          containerStyle={styles.inputContainer}
        />

        {/* Campo Data */}
        <DataField
          label="Data da Avaliação"
          value={data.dataAplicacao ?? ''}  // força string vazia
          onChange={(text) => {
            let isoDate = text.trim();
            if (text.includes('/')) {
              const parts = text.split('/');
              if (parts.length === 3) {
                const [d, m, y] = parts;
                if (d.length === 2 && m.length === 2 && y.length === 4) {
                  isoDate = `${y}-${m}-${d}`;
                }
              }
            }
            updateData({ dataAplicacao: isoDate });
          }}
        />


        {/* Campo Resumo */}
        <InputField
          label="O que deseja buscar na avaliação"
          placeholder="Resumo / Objetivo da avaliação"
          value={data.objetivo}
          onChangeText={(t) => updateData({ objetivo: t })}
          multiline
          numberOfLines={4}
          containerStyle={[styles.inputContainer, styles.textArea]}
        />

        {/* Botão Próxima Etapa */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Próxima Etapa"
            onPress={handleProximaEtapa}
            disabled={!isFormValid}
            buttonColor={{
              backgroundColor: isFormValid ? colors.primary2 : colors.greyBlur,
            }}
            textColor={isFormValid ? colors.textSecondary : colors.textSecondary}
          />
        </View>
      </WizardScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 28,
    marginBottom: 44,
    textAlign: 'center',
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
    maxWidth: 320,
    borderRadius: 12,
    paddingVertical: 14,
  },
});