import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { colors } from '@packages/ui/theme/theme';

interface AtividadeDetalhe {
  id: number;
  titulo: string;
  enunciado: string;
  nivel: string;
  etapaMin?: string | null;
  etapaMax?: string | null;
  imagemUrl?: string | null;
  habilidadeIds: number[];
  areaTitulo: string;
}

interface Props {
  visible: boolean;
  atividade: AtividadeDetalhe | null;
  onClose: () => void;
}

export default function DetailsAtividades({
  visible,
  atividade,
  onClose,
}: Props) {
  if (!atividade) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.modal}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.areaTitle}>{atividade.areaTitulo}</Text>

          <Text style={styles.title}>{atividade.titulo}</Text>

          <Text style={styles.label}>Nível</Text>
          <Text style={styles.value}>{atividade.nivel}</Text>

          {(atividade.etapaMin || atividade.etapaMax) && (
            <>
              <Text style={styles.label}>Etapas</Text>
              <Text style={styles.value}>
                {atividade.etapaMin ?? '-'} até {atividade.etapaMax ?? '-'}
              </Text>
            </>
          )}

          {atividade.enunciado ? (
            <>
              <Text style={styles.label}>Enunciado</Text>
              <Text style={styles.value}>{atividade.enunciado}</Text>
            </>
          ) : (
            <Text style={styles.value}>Sem enunciado.</Text>
          )}

          {atividade.imagemUrl && (
            <>
              <Text style={styles.label}>Imagem</Text>
              <Image
                source={{ uri: atividade.imagemUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            </>
          )}

          {atividade.habilidadeIds?.length > 0 && (
            <>
              <Text style={styles.label}>Habilidades</Text>
              <Text style={styles.value}>
                {atividade.habilidadeIds.join(', ')}
              </Text>
            </>
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  areaTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeText: {
    color: colors.primary,
    fontSize: 14,
  },
  label: {
  marginTop: 12,
  fontSize: 13,
  fontWeight: '600',
  color: colors.primary,
},

value: {
  fontSize: 14,
  color: '#444',
  marginTop: 4,
},

image: {
  width: '100%',
  height: 180,
  marginTop: 8,
  borderRadius: 8,
},
});
