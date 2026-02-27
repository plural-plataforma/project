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
import { UIAtividade } from '@src/types/atividades';

interface Props {
  areaId: number;
  titulo: string;
  atividades: { id: number; descricao: string }[];
  selectedIds: number[]; // 👈 precisa existir
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
    descricao: string;
    areaId: number;
    areaTitulo: string;
  } | null>(null);

  const toggleActivity = (id: number) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
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
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
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
          {atividades.map(atividade => {
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
                      descricao: atividade.descricao,
                      areaId,
                      areaTitulo: titulo,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.activityText,
                      selected && styles.activityTextSelected,
                    ]}
                  >
                    {atividade.descricao}
                  </Text>
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
  activityText: {
    fontSize: 13,
    color: '#276678',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    marginRight: 8,
  },
  activityTextSelected: {
    color: '#fff',
  },
});
