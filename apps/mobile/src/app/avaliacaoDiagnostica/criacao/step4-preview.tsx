// src/screens/avaliacao-diagnostica/criacao/step4-preview.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import ProgressFill from '@src/components/ProgressFill';
import CustomButton from '@src/components/CustomButton';
import WizardScrollView from '@src/components/WizardScrollView';
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

  const [pdfUri, setPdfUri] = useState<string | null>(null);
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
        // Chama o service (responsável por tudo técnico)
        const base64 = await gerarPdfBase64(Number(avaliacaoId));
        setPdfUri(`data:application/pdf;base64,${base64}`);
      } catch (err: any) {
        setPdfError(err.message || 'Não foi possível carregar a pré-visualização do PDF.');
      } finally {
        setLoadingPdf(false);
      }
    };

    loadPdfPreview();
  }, [avaliacaoId, dataVersion]);

  const handleBaixarPdf = async () => {
    if (!pdfUri || !avaliacaoId) return;

    try {
      const fileUri = `${FileSystem.documentDirectory}avaliacao-diagnostica-${avaliacaoId}.pdf`;
      const base64 = pdfUri.split(',')[1];

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Salvar ou compartilhar PDF',
          mimeType: 'application/pdf',
        });
      } else {
        Alert.alert('Sucesso', 'PDF salvo nos arquivos do dispositivo.');
      }
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      Alert.alert('Erro', 'Não foi possível salvar o PDF.');
    }
  };

  const handleFinalizar = () => {
    resetData();
    router.push('/avaliacaoDiagnostica/MinhasAvaliacoes');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Pré-visualização" fixed />

      <WizardScrollView>
        <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

        <Text style={styles.sectionTitle}>Pré-visualização da Avaliação</Text>

        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Título: {data.titulo || '—'}</Text>
          <Text style={styles.previewText}>Objetivo: {data.objetivo || 'Não informado'}</Text>
          <Text style={styles.previewText}>Data: {data.dataAplicacao || '—'}</Text>
          <Text style={styles.previewText}>Alunos selecionados: {data.alunoIds.length}</Text>
          <Text style={styles.previewText}>Blocos/Áreas: {data.blocos.length}</Text>
        </View>

        <View style={styles.pdfContainer}>
          {loadingPdf ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando pré-visualização do PDF...</Text>
            </View>
          ) : pdfError ? (
            <Text style={styles.errorText}>{pdfError}</Text>
          ) : pdfUri ? (
            Platform.OS === 'web' ? (
              <iframe
                src={pdfUri}
                style={StyleSheet.flatten([
                  styles.webview,           // reusa o estilo { flex: 1 }
                  { height: '100%', width: '100%' } // garante 100% do container
                ])}
                title="Pré-visualização da Avaliação Diagnóstica"
              />
            ) : (
              <WebView
                source={{ uri: pdfUri }}
                style={styles.webview}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error:', nativeEvent);
                }}
              />
            )
          ) : (
            <Text style={styles.noPdfText}>Pré-visualização indisponível</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Baixar PDF"
            onPress={handleBaixarPdf}
            disabled={loadingPdf || !!pdfError || !pdfUri}
            buttonColor={{ backgroundColor: colors.primary2 }}
          />
          <p style={styles.button}></p>
          <CustomButton
            title="Finalizar"
            onPress={handleFinalizar}
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
    marginBottom: 24,
  },
  previewText: {
    fontSize: 16,
    marginBottom: 12,
    color: colors.textPrimary,
  },
  pdfContainer: {
    height: Platform.OS === 'web' ? 600 : 500,
    minHeight: 400,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    backgroundColor: '#fff',
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  noPdfText: {
    textAlign: 'center',
    padding: 40,
    color: colors.textSecondary,
    fontSize: 16,
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,

  },
  button: {
    marginBottom: 12,
  },
});