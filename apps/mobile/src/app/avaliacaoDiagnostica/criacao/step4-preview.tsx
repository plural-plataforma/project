// src/screens/avaliacao-diagnostica/criacao/step1-identificacao.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ProgressFill from '@src/components/ProgressFill';
import CustomButton from '@src/components/CustomButton';
import { colors } from '@packages/ui/theme/theme';
import { ArrowLeft } from 'phosphor-react-native';
import { useProgress } from './context/ProgressContext';
import WizardScrollView from '@src/components/WizardScrollView';
import Header from '@src/components/Header';

export default function Step4Preview() {
  const router = useRouter();
  const { currentStep, totalSteps } = useProgress();

  // Estados mínimos para validar o botão (pode expandir depois)
  const [titulo, setTitulo] = useState('');
  const [dataAvaliacao, setDataAvaliacao] = useState<Date | null>(null);

  // Validação simples para habilitar o botão
  const isFormValid = true;

  const handleProximaEtapa = () => {
    if (isFormValid) {
      // Aqui você salva os dados no contexto global do wizard (se tiver) 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Avaliação Diagnóstica" fixed />
      <WizardScrollView>

        {/* Progresso (seu componente) */}
        <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

        {/* Título da etapa */}
        <Text style={styles.sectionTitle}>Visualização da Prévia</Text>

        {/* Conteúdo da etapa 1 - será expandido depois */}
        <View style={styles.placeholderContent}>
          <Text style={styles.headerTitle}>
            PDF Preview
          </Text>
        </View>

        {/* Botão Próxima Etapa - sempre visível, opacity só quando disabled */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Salvar PDF"
            onPress={handleProximaEtapa}
            disabled={!isFormValid}
            buttonColor={{
              backgroundColor: colors.primary2,
            }}
            textColor={colors.textSecondary}
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
    textAlign: 'center',
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  nextButton: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    paddingVertical: 14,
  },
});