import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { User } from 'phosphor-react-native'

import Header from '@src/components/Header'
import ProgressFill from '@src/components/ProgressFill'
import SelectableItem from '@src/components/SelectableItem'
import { colors } from '@packages/ui/theme/theme'
import { useProgress } from './context/ProgressContext'
import CustomButton from '@src/components/CustomButton'
import WizardScrollView from '@src/components/WizardScrollView'
import SchoolFilter from '@src/components/SchoolFilter'

interface Escola {
  value: number
  label: string
}

interface Aluno {
  id: number
  nome: string
  escolaId: number
}

const mockEscolas: Escola[] = [
  { value: 1, label: 'Escola Municipal de Ensino Infantil' },
  { value: 2, label: 'Escola Municipal de Ensino Infantil' },
]

const mockAlunos: Aluno[] = [
  { id: 1, nome: 'Ana Maria Silva', escolaId: 1 },
  { id: 2, nome: 'Bernardo Almeira', escolaId: 1 },
  { id: 3, nome: 'Catarina Melo', escolaId: 1 },
  { id: 4, nome: 'Daniel Luis', escolaId: 1 },
  { id: 5, nome: 'Eduarda Lima', escolaId: 2 },
  { id: 6, nome: 'Fabiano Garcia', escolaId: 2 },
]


export default function Step2Alunos() {
  const router = useRouter()
  const { currentStep, totalSteps } = useProgress()

  const [alunosSelecionados, setAlunosSelecionados] = useState<number[]>([])
  const [escolaSelecionada, setEscolaSelecionada] = useState<number | null>(null)
  const isFormValid = alunosSelecionados.length > 0
  const toggleAluno = (id: number) => {
    setAlunosSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const alunosFiltrados = escolaSelecionada
  ? mockAlunos.filter(a => a.escolaId === escolaSelecionada)
  : []

  const renderAluno = ({ item }: { item: Aluno }) => {
    const selecionado = alunosSelecionados.includes(item.id)

    return (
      <SelectableItem
        label={item.nome}
        selected={selecionado}
        onPress={() => toggleAluno(item.id)}
        LeftIcon={<User size={22} color={colors.primary} />}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Avaliação Diagnóstica" fixed />

      <WizardScrollView>
        <ProgressFill
          completedSections={currentStep}
          totalSections={totalSteps}
        />

        <SchoolFilter
          options={mockEscolas}
          selectedValue={escolaSelecionada}
          onChange={(value) => {
            setEscolaSelecionada(value)
            setAlunosSelecionados([])
          }}
        />
        <FlatList
          data={alunosFiltrados}
          keyExtractor={item => item.id.toString()}
          renderItem={renderAluno}
          contentContainerStyle={{ paddingTop: 12 }}
        />

        {/* Botão Próxima Etapa */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Próxima Etapa"
            onPress={() =>
              router.push('/avaliacaoDiagnostica/criacao/step3-areas')
            }
            disabled={!isFormValid}
            buttonColor={{
              backgroundColor: isFormValid ? colors.primary2 : colors.greyBlur,
            }}
            textColor={isFormValid ? colors.textSecondary : colors.textSecondary}
          />
        </View>
      </WizardScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
    paddingTop: 24,
    marginBottom: 8,
  },
  escolaBox: {
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(39,102,120,0.42)',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  escolaText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.primary,
  },
  botao: {
    marginTop: 32,
    height: 54,
    borderRadius: 6,
    backgroundColor: '#FFBE33',
    justifyContent: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 40,
  },
  botaoTexto: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
  },
})
