import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ProgressFill from '@src/components/ProgressFill';
import CustomButton from '@src/components/CustomButton';
import WizardScrollView from '@src/components/WizardScrollView';
import Header from '@src/components/Header';
import { colors } from '@packages/ui/theme/theme';
import { useProgress } from './context/ProgressContext';
import { useCreation } from './context/CreationContext';
import { criarAvaliacaoDiagnostica } from '@src/services/avaliacaoDiagnosticaService';
import { Alert } from 'react-native';

export default function Step4Preview() {
  const router = useRouter();
  const { currentStep, totalSteps } = useProgress();
  const { data, resetData } = useCreation();

  function parseDateToIso(dateStr: string): string | undefined {
    if (!dateStr) return undefined;

    const [day, month, year] = dateStr.split('/');

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toISOString();
  }


  const handleSalvar = async () => {
    const payload = {
      titulo: data.titulo,
      objetivo: data.objetivo || undefined,
      dataAplicacao: parseDateToIso(data.dataAplicacao),
      alunoIds: data.alunoIds,
      blocos: data.blocos,
    };

    try {
      await criarAvaliacaoDiagnostica(payload);
      Alert.alert('Sucesso', 'Avaliação diagnóstica criada com sucesso!');
      resetData();
      router.push('/avaliacaoDiagnostica/MinhasAvaliacoes'); // ou sua tela de listagem
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a avaliação.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Avaliação Diagnóstica" fixed />
      <WizardScrollView>
        <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

        <Text style={styles.sectionTitle}>Pré-visualização</Text>

        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Título: {data.titulo}</Text>
          <Text style={styles.previewText}>Objetivo: {data.objetivo || 'Não informado'}</Text>
          <Text style={styles.previewText}>Data: {data.dataAplicacao}</Text>
          <Text style={styles.previewText}>Alunos: {data.alunoIds.length}</Text>
          <Text style={styles.previewText}>Blocos: {data.blocos.length}</Text>
          {/* Aqui você pode adicionar o PDF preview real quando tiver */}
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Salvar Avaliação"
            onPress={handleSalvar}
            buttonColor={{ backgroundColor: colors.primary2 }}
            textColor={colors.textSecondary}
          />
        </View>
      </WizardScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, textAlign: 'center', marginVertical: 32 },
  previewContainer: { padding: 20, backgroundColor: '#f9f9f9', borderRadius: 12, marginHorizontal: 16 },
  previewText: { fontSize: 16, marginBottom: 8 },
  buttonContainer: { alignItems: 'center', marginTop: 40, paddingBottom: 40 },
});