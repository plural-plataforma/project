// components/CadastroHeader.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';
import { ArrowLeft, CaretLeft } from 'phosphor-react-native'; // Ícone do phosphor
import { useRouter } from 'expo-router'; // Para navegação automática
import { colors, fontSizes } from '@/packages/ui/theme/theme';
import ButtonBack from './ButtonBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Para SafeArea automático se não passado

const { width: screenWidth } = Dimensions.get('window');
const HEADER_HEIGHT = 40; // Altura base; ajuste se necessário
const TOP_SPACING = 10; // Espaçamento superior original (marginTop: 29)

interface CadastroHeaderProps {
  title: string; // Título customizável
  onBack?: () => void;
  fixed?: boolean; // Novo: se true, aplica position absolute e zIndex para fixar no topo
  insets?: { top: number }; // Opcional: passa insets de SafeArea do parent; senão usa hook interno
}

export default function Header({ title, onBack, fixed = false, insets: propInsets }: CadastroHeaderProps) {
  const router = useRouter();
  const defaultInsets = useSafeAreaInsets(); // Fallback se não passado
  const insets = propInsets || defaultInsets;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const headerStyle = fixed
    ? [styles.headerFixed, { top: insets.top, zIndex: 1000 }] // Fixed mode: absolute no topo
    : [styles.header]; // Modo normal: relative com margins

  return (
    <View style={headerStyle}>
      <View style={styles.view}>
        {/* Back Button */}
        <ButtonBack />
        {/* Título */}
        <Text style={[styles.title, styles.groupIconPosition]}>{title}</Text>

        {/* Logo */}
        <Image
          source={require('@/packages/ui/assets/images/logo-small.png')}
          style={[styles.groupIcon, styles.groupIconPosition]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: TOP_SPACING,
    marginBottom: 10,
    marginHorizontal: 20, // Ajustado para horizontal (seu 'margin:20' era global)
    paddingBottom: 20,
  },
  headerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingInline:16,
    backgroundColor: '#fff', // Evita transparência no scroll
    paddingTop: TOP_SPACING, // Adicionado: replica o marginTop original para evitar elementos colados no topo
    elevation: 4, // Sombra Android
    shadowColor: '#000', // Sombra iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  view: {
    height: HEADER_HEIGHT,
    marginBottom: 10,
  },
  groupIconPosition: {
    top: '0%',
    position: 'absolute',
  },
  title: {
    left: '20%',
    fontWeight: '600',
    fontSize: fontSizes.f20,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    width: 220,
    color: colors.primary,
    height: '100%',
  },
  groupIcon: {
    marginTop: 8,
    height: '72.84%',
    width: '12.43%',
    right: '0%',
    left: '87.57%',
    maxHeight: '100%',
    overflow: 'hidden',
    maxWidth: '100%',
  },
});