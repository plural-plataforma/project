// components/CadastroHeader.tsx
// Coloque este componente em src/components/CadastroHeader.tsx (ajuste path conforme sua estrutura)
// É reutilizável para telas de cadastro, com back button, título e logo customizável.
import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native'
import { ArrowLeft, CaretLeft } from 'phosphor-react-native' // Ícone do phosphor (já no seu package.json)
import { useRouter } from 'expo-router' // Para navegação automática
import { colors, fontSizes } from '@/packages/ui/theme/theme'
import ButtonBack from './ButtonBack'

const { width: screenWidth } = Dimensions.get('window')
const HEADER_HEIGHT = 60

interface CadastroHeaderProps {
  title: string // Título customizável (default: 'Cadastro')
  onBack?: () => void
}

export default function Header({ title, onBack }: CadastroHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <View style={styles.header}>
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
  )
}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    marginTop: 29,
    marginBottom: 10,
  },
  view: {
    height: 48,
    flex: 1
  },


  groupIconPosition: {
    top: "0%",
    position: "absolute"
  },
  title: {
    marginTop: 20,
    left: "20%",
    fontWeight: '600',
    fontSize: fontSizes.f20,
    fontFamily: "Poppins-Regular",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    width: 220,
    color: colors.primary,
    height: "100%"
  },

  groupIcon: {
    marginTop: 16,
    height: "72.84%",
    width: "12.43%",
    right: "0%",
    left: "87.57%",
    maxHeight: "100%",
    overflow: "hidden",
    maxWidth: "100%"
  }
})
