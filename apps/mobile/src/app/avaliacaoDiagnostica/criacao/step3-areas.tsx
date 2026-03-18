import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ProgressFill from '@src/components/ProgressFill';
import CustomButton from '@src/components/CustomButton';
import { colors } from '@packages/ui/theme/theme';
import { useProgress } from './context/ProgressContext';
import WizardScrollView from '@src/components/WizardScrollView';
import Header from '@src/components/Header';
import { ExpandableArea } from '@src/components/ExpandableArea'; // ajuste o caminho se necessário
import { buscarBlocosComAtividades } from '@src/services/blocosService';
import { useCreation } from './context/CreationContext';
import { BlocoSelecionadoDTO } from '@src/types/avaliacao-diagnostica';
import { atualizarAvaliacaoDiagnostica, criarAvaliacaoDiagnostica } from '@src/services/avaliacaoDiagnosticaService';
import parseDateToIso from '@src/utils/parseDateToIso';
import { Atividade } from '@src/types/atividades'; // ← importe a interface correta

// Tipo simplificado para o que o ExpandableArea espera
interface BlocoUI {
  id: number;
  titulo: string;
  atividades: Atividade[];
}

export default function Step2Areas() {
  const router = useRouter();
  const { currentStep, totalSteps } = useProgress();
  const { updateData, data } = useCreation();
  const [loading, setLoading] = useState(true);
  const [blocos, setBlocos] = useState<BlocoUI[]>([]);

  const { avaliacaoId, isEditing, startEditing } = useCreation();

  const isFormValid = data.blocos.length > 0;

  const handleGerarAvaliacao = async () => {
    const dataIso = parseDateToIso(data.dataAplicacao);
    if (!dataIso || dataIso === 'Invalid Date') {
      Alert.alert('Erro', 'Data de aplicação inválida. Use o formato correto (ex: DD/MM/AAAA).');
      return;
    }

    const payload = {
      id: avaliacaoId,
      titulo: data.titulo?.trim() || '',
      objetivo: data.objetivo?.trim() || '',
      dataAplicacao: dataIso,
      escolaId: data.escolaId ?? null,
      alunoIds: data.alunoIds || [],
      blocos: data.blocos.map(b => ({
        blocoId: b.blocoId,
        atividadeIds: b.atividadeIds || [],
      })),
      concluida: false,
    };

    if (!payload.titulo) {
      Alert.alert('Erro', 'O título da avaliação é obrigatório.');
      return;
    }

    try {
      let idSalvo: number;

      if (isEditing && avaliacaoId) {
        console.log('Atualizando avaliação existente ID:', avaliacaoId);
        await atualizarAvaliacaoDiagnostica(avaliacaoId, payload);
        idSalvo = avaliacaoId;
      } else {
        console.log('Criando nova avaliação...');
        const resposta = await criarAvaliacaoDiagnostica(payload);
        idSalvo = resposta.id || resposta.Id;
        console.log('Criada com ID:', idSalvo);
      }

      await startEditing(idSalvo);

      router.push({
        pathname: '/avaliacaoDiagnostica/criacao/step4-preview',
        params: { avaliacaoId: idSalvo.toString() },
      });

      Alert.alert('Sucesso', 'Avaliação salva com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar avaliação:', err);

      let mensagem = 'Erro ao salvar avaliação';

      if (err.response?.data) {
        const backendData = err.response.data;
        mensagem =
          backendData?.mensagem ||
          (Array.isArray(backendData?.mensagens) ? backendData.mensagens.join('\n') : '') ||
          backendData?.title ||
          err.message;
      }

      Alert.alert('Erro ao salvar', mensagem);
    }
  };

  const handleAreaChange = (atividadeIds: number[], areaId: number) => {
    const currentBlocos = data.blocos || [];
    const filtered = currentBlocos.filter(b => b.blocoId !== areaId);

    let newBlocos: BlocoSelecionadoDTO[] = filtered;

    if (atividadeIds.length > 0) {
      newBlocos = [...filtered, { blocoId: areaId, atividadeIds }];
    }

    updateData({ blocos: newBlocos });
  };

  const getSelectedIds = (areaId: number) => {
    const bloco = data.blocos?.find(b => b.blocoId === areaId);
    return bloco?.atividadeIds || [];
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const response = await buscarBlocosComAtividades();

        // Ajuste conforme a estrutura real retornada pela API
        const blocosUI: BlocoUI[] = response.map((bloco: any) => ({
          id: bloco.id,
          titulo: bloco.titulo,
          atividades: bloco.atividades.map((a: Atividade) => ({
            id: a.id,
            titulo: a.titulo,
            enunciado: a.enunciado,
            nivel: a.nivel,
            etapaMin: a.etapaMin,
            etapaMax: a.etapaMax,
            imagemUrl: a.imagemUrl,
            habilidadeIds: a.habilidadeIds || [],
            blocoId: a.blocoId,
            ativo: a.ativo,
          })),
        }));

        setBlocos(blocosUI);
      } catch (error) {
        console.error('Erro ao carregar blocos e atividades:', error);
        Alert.alert('Erro', 'Não foi possível carregar as áreas e atividades.');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Avaliação Diagnóstica" fixed />
        <View style={styles.loadingContainer}>
          <Text>Carregando áreas e atividades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Avaliação Diagnóstica" fixed />
      <WizardScrollView>
        <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

        <Text style={styles.sectionTitle}>Quais áreas deseja avaliar agora?</Text>

        {blocos.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma área encontrada</Text>
        ) : (
          blocos.map(area => (
            <ExpandableArea
              key={area.id}
              areaId={area.id}
              titulo={area.titulo}
              atividades={area.atividades}
              selectedIds={getSelectedIds(area.id)}
              onChange={ids => handleAreaChange(ids, area.id)}
            />
          ))
        )}

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Gerar Avaliação Diagnóstica"
            onPress={handleGerarAvaliacao}
            disabled={!isFormValid}
            buttonColor={{ backgroundColor: colors.primary2 }}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 28,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
});