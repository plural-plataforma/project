import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  CaretDown,
  CaretUp,
  CheckSquare,
  Plus,
  Minus,
} from 'phosphor-react-native';
import { colors } from '@packages/ui/theme/theme';
import DetailsAtividades from '@src/app/avaliacaoDiagnostica/criacao/detailsAtividades';

interface AtividadeItem {
  id: number;
  titulo: string;
  enunciado: string;
  nivel: string;
  habilidadeIds: number[];
  imagemUrl: string | null;
  etapaMin: string | null;
  etapaMax: string | null;
}

interface Props {
  areaId: number;
  titulo: string;
  atividades: AtividadeItem[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function ExpandableArea({
  titulo,
  areaId,
  atividades,
  selectedIds,
  onChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [atividadeModal, setAtividadeModal] = useState<{
    id: number;
    titulo: string;
    enunciado: string;
    areaTitulo: string;
    nivel: string;
    habilidadeIds: number[];
    etapaMin?: string | null;
    etapaMax?: string | null;
    imagemUrl?: string | null;
  } | null>(null);

  const toggleActivity = (id: number) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];

    onChange?.(updated);
  };

  const toggleArea = () => {
    if (selectedIds.length > 0) {
      onChange?.([]);
    } else {
      setExpanded(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Pressable style={styles.header} onPress={() => setExpanded(!expanded)}>
        <Pressable onPress={toggleArea}>
          <CheckSquare
            size={22}
            color={colors.primary}
            weight={selectedIds.length ? 'fill' : 'regular'}
          />
        </Pressable>

        <Text style={styles.title}>{titulo}</Text>

        {expanded ? <CaretUp size={20} /> : <CaretDown size={20} />}
      </Pressable>

      {/* BODY */}
      {expanded && (
        <View style={styles.body}>
          {atividades.map((atividade) => {
            const selected = selectedIds.includes(atividade.id);

            return (
              <View
                key={atividade.id}
                style={[
                  styles.activityRow,
                  selected && styles.activitySelected,
                ]}
              >
                {/* TEXTO → ABRE MODAL */}
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() =>
                    setAtividadeModal({
                      id: atividade.id,
                      titulo: atividade.titulo,
                      enunciado: atividade.enunciado,
                      areaTitulo: titulo,
                      nivel: atividade.nivel,
                      habilidadeIds: atividade.habilidadeIds,
                      etapaMin: atividade.etapaMin,
                      etapaMax: atividade.etapaMax,
                      imagemUrl: atividade.imagemUrl,
                    })
                  }
                >
                  <View style={styles.activityInfo}>
                    <Text
                      style={[
                        styles.activityTitle,
                        selected && styles.activityTitleSelected,
                      ]}
                    >
                      {atividade.titulo}
                    </Text>

               
                  </View>
                </Pressable>

                {/* ÍCONE → SELEÇÃO */}
                <Pressable onPress={() => toggleActivity(atividade.id)}>
                  {selected ? (
                    <Minus size={18} color="#fff" />
                  ) : (
                    <Plus size={18} color={colors.primary} />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* MODAL */}
      <DetailsAtividades
        visible={!!atividadeModal}
        atividade={atividadeModal}
        onClose={() => setAtividadeModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(39,102,120,0.42)',
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#276678',
    fontFamily: 'Poppins-Regular',
  },
  body: {
    backgroundColor: '#F6F6F6',
    padding: 12,
  },
  activityRow: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activitySelected: {
    backgroundColor: '#276678',
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#276678',
  },
  activityTitleSelected: {
    color: '#fff',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  activitySubtitleSelected: {
    color: '#eee',
  },
  activityPreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginTop: 4,
  },
  activityPreviewSelected: {
    color: '#ddd',
  },
});