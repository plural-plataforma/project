import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors } from '@packages/ui/theme/theme';

interface Props {
  visible: boolean;
  atividade: {
    id: number;
    descricao: string;
    areaId: number;
    areaTitulo: string;
  } | null;
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
        <Text style={styles.areaTitle}>{atividade.areaTitulo}</Text>

        <Text style={styles.title}>Detalhes da Atividade</Text>

        <Text style={styles.description}>
          {atividade.descricao}
        </Text>

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Fechar</Text>
        </Pressable>
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
});
