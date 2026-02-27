import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
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
import { BlocoArea, BlocoComAtividade, BlocoUI } from '@src/types/bloco';
import { buscarBlocosComAtividades } from '@src/services/blocosService';
import { api } from '@src/services/auth';
import { useCreation } from './context/CreationContext';
import { BlocoSelecionadoDTO } from '@src/types/avaliacao-diagnostica';
import { atualizarAvaliacaoDiagnostica, criarAvaliacaoDiagnostica } from '@src/services/avaliacaoDiagnosticaService';
import parseDateToIso from '@src/utils/parseDateToIso';

interface Atividade {
  id: number;
  descricao: string;
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
  const { updateData, data } = useCreation();
  const [loading, setLoading] = useState(true)

  const [blocos, setBlocos] = useState<BlocoUI[]>([]);
  const [expandedBlocos, setExpandedBlocos] = useState<number[]>([]);
  const [areasSelecionadas, setAreasSelecionadas] = useState<AreaSelecionada[]>([])
  const isFormValid = data.blocos.length > 0;

  const { avaliacaoId, isEditing, startEditing } = useCreation();

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

  const handleGerarAvaliacao = async () => {
   // if (!isFormValid) {
     // Alert.alert('Atenção', 'Selecione pelo menos um bloco/área antes de gerar.');
    //  return;
   // }

   // if (!data.dataAplicacao || data.dataAplicacao.trim() === '') {
   //   Alert.alert('Atenção', 'A data de aplicação é obrigatória.');
    //  return;
   // }

    const dataIso = parseDateToIso(data.dataAplicacao);
    if (!dataIso || dataIso === 'Invalid Date') {
      Alert.alert('Erro', 'Data de aplicação inválida. Use o formato correto (ex: DD/MM/AAAA).');
      return;
    }

    const payload = {
      titulo: data.titulo?.trim() || '',
      objetivo: data.objetivo?.trim() || '',
      dataAplicacao: dataIso,  // já parseado corretamente
      escolaId: data.escolaId ?? null,
      alunoIds: data.alunoIds || [],
      blocos: data.blocos.map(b => ({
        blocoId: b.blocoId,
        atividadeIds: b.atividadeIds || []
      })),
      concluida: false,
    };

    if (!payload.titulo) {
      Alert.alert('Erro', 'O título da avaliação é obrigatório.');
      return;
    }

    try {
      let idSalvo: number;

      // Decisão correta: se já tem ID e está em edição → PUT
      if (isEditing && avaliacaoId) {
        console.log('Atualizando avaliação existente ID:', avaliacaoId);
        const resposta = await atualizarAvaliacaoDiagnostica(avaliacaoId, payload);
        idSalvo = avaliacaoId; // mantém o ID
      } else {
        // Criação (POST)
        console.log('Criando nova avaliação...');
        console.log('Payload final enviado:', JSON.stringify(payload, null, 2));
        const resposta = await criarAvaliacaoDiagnostica(payload);
        idSalvo = resposta.id || resposta.Id; // ajuste conforme o campo retornado
        console.log('Criada com ID:', idSalvo);
      }

      // Sincroniza o contexto (recarrega dados frescos do backend)
      await startEditing(idSalvo);

      // Navega para preview com o ID (atualizado ou novo)
      router.push({
        pathname: '/avaliacaoDiagnostica/criacao/step4-preview',
        params: { avaliacaoId: idSalvo.toString() },
      });

      Alert.alert('Sucesso', 'Avaliação salva com sucesso!');

    } catch (err: any) {
      console.error('Erro completo Axios:', err);

      let mensagem = 'Erro ao salvar avaliação';

      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Headers:', err.response.headers);
        console.log('Data do erro:', err.response.data);

        const backendData = err.response.data;
        mensagem = backendData?.mensagem ||
          (Array.isArray(backendData?.mensagens) ? backendData.mensagens.join('\n') : '') ||
          backendData?.title ||
          err.message;
      }

      Alert.alert('Erro ao salvar', mensagem);
    }
  };

  const handleAddAtividade = () => {
    // Aqui você salva os dados no contexto global do wizard (se tiver)
    router.push('/avaliacaoDiagnostica/criacao/detailsAtividades');
  }

  const handleAreaChange = (atividadeIds: number[], areaId: number) => {
    const currentBlocos = data.blocos || [];

    const filtered = currentBlocos.filter(b => b.blocoId !== areaId);

    let newBlocos: BlocoSelecionadoDTO[] = filtered;

    if (atividadeIds.length > 0) {
      newBlocos = [...filtered, { blocoId: areaId, atividadeIds }];
    }

    updateData({ blocos: newBlocos });
  };



  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const data = await buscarBlocosComAtividades()

      console.log(
        'RAW RESPONSE',
        JSON.stringify((await api.get('/Blocos/com-atividades')).data, null, 2)
      );


      const blocosUI = data.map(bloco => ({
        id: bloco.id,
        titulo: bloco.titulo,
        atividades: bloco.atividades.map(a => ({
          id: a.id,
          descricao: a.titulo, // 👈 OU titulo, depende do que você quer mostrar
        })),
      }))

      setBlocos(blocosUI)
      setLoading(false)
    }

    carregar()
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
        {blocos.map(area => (
          <ExpandableArea
            key={area.id}
            areaId={area.id}
            titulo={area.titulo}
            atividades={area.atividades}
            onChange={(ids) => handleAreaChange(ids, area.id)}
          />
        ))}

        {/* Botão Próxima Etapa - sempre visív el, opacity só quando disabled */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Gerar Avaliação Diagnóstica"
            onPress={handleGerarAvaliacao}
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