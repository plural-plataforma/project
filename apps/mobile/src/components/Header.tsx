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
import { colors } from '@/packages/ui/theme/theme'

const { width: screenWidth } = Dimensions.get('window')
const HEADER_HEIGHT = 60

interface CadastroHeaderProps {
  title: string // Título customizável (default: 'Cadastro')
  onBack?: () => void // Callback para back (default: router.back())
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
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          router.back()
        }}
      >
        <CaretLeft
          size={32}
          color={colors.primary}
          style={{ margin: 8, marginRight: 4, marginLeft: 4 }}
        />
      </TouchableOpacity>
      {/* Título */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/packages/ui/assets/images/logo-small.png')}
          style={[styles.logo]}
          resizeMode="contain"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    backgroundColor: '#fff',
    width: '7%',
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 12,
    opacity: 0.6,
    height: 40,
    borderColor: colors.primary,
    borderRadius: 8
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-start'
  },
  title: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    color: colors.primary,
    textAlign: 'left'
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 32,
    height: 32
  }
})
