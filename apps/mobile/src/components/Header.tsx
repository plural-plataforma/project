// src/components/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { colors, fontSizes } from '@packages/ui/theme/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void; // opcional: callback customizado para voltar
  fixed?: boolean;     // se true, fixa no topo (position: absolute)
}

export default function Header({ title, onBack, fixed = false }: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, fixed && styles.fixed]}>
      {/* Botão Voltar */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <ArrowLeft size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* Título centralizado */}
      <Text style={styles.title}>{title}</Text>

      {/* Logo à direita */}
      <Image
        source={require('@packages/ui/assets/images/logo-small.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
  },
  fixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 4, // sombra no Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 28, // espaço extra para status bar
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: fontSizes.f20,
    fontFamily: 'Nunito_700Bold',
    color: colors.primary,
    paddingHorizontal: 16,
    textAlign: 'left',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
  },
});