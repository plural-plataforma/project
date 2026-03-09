import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ProgressFill from '@src/components/ProgressFill';
import CustomButton from '@src/components/CustomButton';
import Header from '@src/components/Header';
import { colors } from '@packages/ui/theme/theme';
import { useProgress } from './context/ProgressContext';
import { useCreation } from './context/CreationContext';
import { gerarPdfBase64 } from '@src/services/avaliacaoDiagnosticaService';

export default function Step4Preview() {
  const router = useRouter();
  const { avaliacaoId } = useLocalSearchParams<{ avaliacaoId?: string }>();
  const { currentStep, totalSteps } = useProgress();
  const { data, dataVersion, resetData } = useCreation();

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdfPreview = async () => {
      if (!avaliacaoId || isNaN(Number(avaliacaoId))) {
        setPdfError('ID da avaliação inválido ou não encontrado.');
        setLoadingPdf(false);
        return;
      }

      setLoadingPdf(true);
      setPdfError(null);

      try {
        const base64 = await gerarPdfBase64(Number(avaliacaoId));
        setPdfBase64(base64);
      } catch (err: any) {
        setPdfError(err.message || 'Não foi possível carregar o PDF.');
      } finally {
        setLoadingPdf(false);
      }
    };

    loadPdfPreview();
  }, [avaliacaoId, dataVersion]);

  const handleBaixarPdf = () => {
    if (!pdfBase64 || !avaliacaoId) return;

    const linkSource = `data:application/pdf;base64,${pdfBase64}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = linkSource;
    downloadLink.download = `avaliacao-diagnostica-${avaliacaoId}.pdf`;
    downloadLink.click();
  };

  const handleFinalizar = () => {
    resetData();
    router.push('/avaliacaoDiagnostica/MinhasAvaliacoes');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Pré-visualização" fixed />

      <View style={styles.container}>
        {/* Parte superior (informações da avaliação) */}
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

          <Text style={styles.sectionTitle}>Pré-visualização da Avaliação</Text>

          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>Título: {data.titulo || '—'}</Text>
            <Text style={styles.previewText}>Objetivo: {data.objetivo || 'Não informado'}</Text>
            <Text style={styles.previewText}>Data: {data.dataAplicacao || '—'}</Text>
            <Text style={styles.previewText}>Alunos selecionados: {data.alunoIds.length}</Text>
            <Text style={styles.previewText}>Blocos/Áreas: {data.blocos.length}</Text>
          </View>
        

        {/* Área de PDF com scroll */}
        <View style={styles.pdfWrapper}>
          <ScrollView 
            style={styles.pdfScroll}
            contentContainerStyle={styles.pdfContent}
            showsVerticalScrollIndicator={true}
          >
            {loadingPdf ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando pré-visualização...</Text>
              </View>
            ) : pdfBase64 ? (
              <iframe
                src={`data:application/pdf;base64,${pdfBase64}`}
                style={styles.iframe}
                title="Pré-visualização do PDF"
              />
            ) : (
              <Text style={styles.noPdfText}>Pré-visualização indisponível</Text>
            )}
          </ScrollView>
        </View>

        </ScrollView>

        {/* Botões fixos no rodapé */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Baixar PDF"
            onPress={handleBaixarPdf}
            disabled={loadingPdf || !!pdfError || !pdfBase64}
            buttonColor={{ backgroundColor: colors.primary2 }}
          />
          <View style={{ height: 12 }} />
          <CustomButton
            title="Finalizar"
            onPress={handleFinalizar}
            buttonColor={{ backgroundColor: colors.primary2 }}
            textColor={colors.textSecondary}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { 
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginVertical: 24,
  },
  previewContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  previewText: {
    fontSize: 16,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  
  // Novo wrapper para o PDF com scroll
  pdfWrapper: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    overflow: 'hidden',
    minHeight: Dimensions.get('window').height * 0.9, // área maior
  },
  pdfScroll: {
    flex: 1,
  },
  pdfContent: {
    flexGrow: 1,
  },
  iframe: {
    width: '100%',
    height: '100%',
    minHeight: Dimensions.get('window').height * 0.8, // força área maior
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  noPdfText: {
    textAlign: 'center',
    padding: 40,
    color: colors.textSecondary,
    fontSize: 16,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});