import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ProgressFill from '@src/components/ProgressFill';
import CustomButton from '@src/components/CustomButton';
import { colors } from '@packages/ui/theme/theme';
import { ArrowLeft } from 'phosphor-react-native';
import { useProgress } from './context/ProgressContext';
import WizardScrollView from '@src/components/WizardScrollView';
import Header from '@src/components/Header';
import { ExpandableArea } from '@src/components/ExpandableArea';
import { is } from 'zod/v4/locales';

interface Atividade {
  id: number;
  descricao: string;
}

interface BlocoArea {
  id: number;
  titulo: string;
  atividades: Atividade[];
}

type AreaSelecionada = {
  areaId: number;
  atividades: number[];
};

const areasMock: BlocoArea[] = [
  {
    id: 1,
    titulo: 'Alfabeto',
    atividades: [
      { id: 1, descricao: 'Leia as palavras e faça os desenhos' },
      { id: 2, descricao: 'Circule a letra que a professora disser' },
      { id: 3, descricao: 'Leia o pequeno texto para a professora' },
    ],
  },
  {
    id: 2,
    titulo: 'Sílabas',
    atividades: [
      { id: 4, descricao: 'Complete as sílabas faltantes' },
      { id: 5, descricao: 'Ligue as sílabas às figuras' },
    ],
  },
];

export default function Step2Areas() {
  const router = useRouter();
  const { currentStep, totalSteps } = useProgress();

  const [bloco, setBloco] = useState<BlocoArea[]>([]);
  const [expandedBlocos, setExpandedBlocos] = useState<number[]>([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState<AreaSelecionada[]>([])
  const isValid = areasSelecionadas.length > 0;

  const toggleBloco = (id: number) => {
    setExpandedBlocos(prev =>
      prev.includes(id)
        ? prev.filter(b => b !== id)
        : [...prev, id]
    );
  };

  // Estados mínimos para validar o botão (pode expandir depois)
  const [titulo, setTitulo] = useState('');
  const [dataAvaliacao, setDataAvaliacao] = useState<Date | null>(null);

  // Validação simples para habilitar o botão
  const isFormValid = true;

  const handleGerarAvaliacao = () => {
    if (isFormValid) {
      // Aqui você salva os dados no contexto global do wizard (se tiver)
      router.push('/avaliacaoDiagnostica/criacao/step4-preview');
    }
  };

  const handleAddAtividade = () => {
    // Aqui você salva os dados no contexto global do wizard (se tiver)
    router.push('/avaliacaoDiagnostica/criacao/detailsAtividades');
  }

  const handleAreaChange = (
    data: AreaSelecionada | null,
    areaId: number
  ) => {
    setAreasSelecionadas(prev => {
      if (!data) {
        return prev.filter(a => a.areaId !== areaId);
      }

      const exists = prev.some(a => a.areaId === areaId);

      if (exists) {
        return prev.map(a =>
          a.areaId === areaId ? data : a
        );
      }

      return [...prev, data];
    });
  };


  useEffect(() => {
    // async function carregarBloco() {
    //   const response = await fetch('https://sua-api/blocos/1');
    //   const data = await response.json();
    //   setBloco(data);
    // }

    // carregarBloco();

    setBloco(areasMock);
  }, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Avaliação Diagnóstica" fixed />
      <WizardScrollView>
        {/* Progresso (seu componente) */}
        <ProgressFill completedSections={currentStep} totalSections={totalSteps} />

        {/* Título da etapa */}
        <Text style={styles.sectionTitle}>Quais áreas deseja avaliar agora?</Text>

        {/* Conteúdo da etapa 1 - será expandido depois */}
        {bloco.map(area => (
          <ExpandableArea
            key={area.id}
            areaId={area.id}
            titulo={area.titulo}
            atividades={area.atividades}
            onChange={handleAreaChange}
          />
        ))}

        {/* Botão Próxima Etapa - sempre visív el, opacity só quando disabled */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Visualizar Prévia "
            onPress={handleGerarAvaliacao}
            disabled={!isValid}
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 28,
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
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(39, 102, 120, 0.42)',
  },

  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#276678',
    fontFamily: 'Poppins-Regular',
    marginBottom: 16,
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  activityText: {
    fontSize: 13,
    color: '#276678',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    paddingRight: 12,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#276678',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  arrow: {
    fontSize: 14,
    color: '#276678',
  },

  activitiesContainer: {
    marginTop: 12,
  },


});