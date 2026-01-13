import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Image, StyleSheet, Platform, Dimensions } from 'react-native'  // Adicione Dimensions
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'  // Adicione useState e useEffect
import { colors } from '@packages/ui/theme/theme'
import { Button, Logo } from '@packages/ui/components'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')  // Pega dimensões da tela

export default function Index() {
  const router = useRouter()
  const [imagePositions, setImagePositions] = useState<{ x: number; y: number }[]>([])  // Array de posições randômicas
  const numImages = 5  // Número de imagens; ajuste aqui

  const generateRandomPositions = () => {
    const positions: { x: number; y: number }[] = []
    for (let i = 0; i < numImages; i++) {
      let x: number, y: number;  // Typed declaration
      let isOverlapping = false
      do {
        x = Math.floor(Math.random() * (screenWidth - 60))  // Limita largura - tamanho da img
        y = Math.floor(Math.random() * (screenHeight - 60))  // Limita altura - tamanho da img
        isOverlapping = positions.some(pos => 
          Math.abs(pos.x - x) < 60 && Math.abs(pos.y - y) < 60  // Evita sobreposição (distância > 60px)
        )
      } while (isOverlapping)  // Loop até posição válida
      positions.push({ x, y })
    }
    return positions
  }

  useEffect(() => {
    // Gera posições randômicas no mount
    const positions = generateRandomPositions()
    setImagePositions(positions)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Múltiplas imagens da mesma source em posições randômicas (no fundo) */}
        {imagePositions.map((position, index) => (
          <Image 
            key={index}  // Chave única para cada instância
            source={require('@/packages/ui/assets/images/plur.png')}  // Mesma imagem para todas
            style={[
              styles.randomImage,
              { left: position.x, top: position.y }  // Posição randômica única
            ]}
            resizeMode="contain"
          />
        ))}

        <View style={{ width: "100%", flexDirection: "row", justifyContent: 'center', marginTop: 20 }}>
          <Logo width={176.21} height={229} styles={{ logo: { margin: 58, alignSelf: 'center' } }} href="logo-inicial" />
        </View>
        
        <Text style={styles.ondeCadaAlunoContainer}>
          <Text style={[styles.ondeCada, styles.textTypo]}>{`Onde cada
`}</Text>
          <Text style={styles.aluno}>
            <Text style={styles.ondeCadaAlunoContainerAluno}>aluno</Text>
            <Text style={styles.textTypo}>{` `}</Text>
          </Text>
          <Text style={styles.ondeCadaAlunoContainerAluno}>
            <Text style={styles.importaCada}>{`importa, cada `}</Text>
            <Text style={styles.aluno}>progresso</Text>
            <Text style={styles.importaCada}> conta.</Text>
          </Text>
        </Text>

        <View style={{
          marginTop: 75
        }}></View>
        <Button
          title="Acessar"
          buttonColor={{
            color: colors.textPrimary,
            backgroundColor: colors.textPrimary
          }}
          textColor={[
            styles.buttonText,
            {
              color: colors.textSecondary
            }
          ]}
          onPress={() => router.push('/auth/login')}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBEBEB'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'  // Necessário para absolute das imagens
  },
  // Estilo base para cada imagem (agora no fundo)
  randomImage: {
    position: 'absolute',
    width: 60,  // Tamanho fixo; ajuste
    height: 60,
    zIndex: -1,  // Negativo: fica atrás de todos os elementos
    borderRadius: 30,  // Opcional: arredondado
    opacity: 0.3,  // Opcional: mais sutil no fundo
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40
  },
  slugan: {
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  button: {
    width: '80%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textTypo: {
    fontFamily: 'Nunito_SemiBold',
    fontWeight: "600"
  },
  ondeCadaAlunoContainer: {
    width: 271,
    height: 90,
    fontSize: 27,
    letterSpacing: -0.3,
    lineHeight: 30,
    textAlign: "center"
  },
  ondeCada: {
    color: "#276678"
  },
  aluno: {
    color: "#a786b6"
  },
  ondeCadaAlunoContainerAluno: {
    fontWeight: "800",
    fontFamily: 'Nunito_700Bold'
  },
  importaCada: {
    color: "#276678"
  }
})