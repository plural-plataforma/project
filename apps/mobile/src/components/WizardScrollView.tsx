import React, { ReactNode } from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@packages/ui/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: screenHeight } = Dimensions.get('window');

interface WizardScrollViewProps {
  children: ReactNode;
  contentContainerStyle?: object;
  showsVerticalScrollIndicator?: boolean;
  headerHeight?: number; // altura do header fixo (para compensar paddingTop)
}

export default function WizardScrollView({
  children,
  contentContainerStyle = {},
  showsVerticalScrollIndicator = true,
  headerHeight = 20, // ajuste conforme seu Header fixo (header + padding + safe area)
}: WizardScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: headerHeight + insets.top + 20 }, // compensa header fixo + espaço extra
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140, // espaço generoso para o botão no final (evita ficar colado na borda)
    minHeight: '100%',  // garante que o conteúdo ocupe a tela inteira
  },
});