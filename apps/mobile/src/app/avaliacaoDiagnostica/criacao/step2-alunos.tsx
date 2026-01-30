import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import Header from '@src/components/Header'
import ProgressFill from '@src/components/ProgressFill'
import CustomButton from '@src/components/CustomButton'
import WizardScrollView from '@src/components/WizardScrollView'
import AlunoSelection from '@src/components/AlunoSelection'

import { colors } from '@packages/ui/theme/theme'
import { useProgress } from './context/ProgressContext'

import { Aluno } from '@src/types/aluno'
import { Escola } from '@src/types/escolas'
import { buscarAlunos } from '@src/services/alunoService'
import { buscarEscolas } from '@src/services/escolasService'


export default function Step2Alunos() {
  const router = useRouter()
  const { currentStep, totalSteps } = useProgress()

  const [alunosSelecionados, setAlunosSelecionados] = useState<Aluno[]>([])


  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [escolas, setEscolas] = useState<Escola[]>([])

   useEffect(() => {
      const load = async () => {
        const [als, escs] = await Promise.all([
          buscarAlunos(),
          buscarEscolas()
        ])

          setAlunos(als)

        setEscolas(escs)
      }
      load()
    }, [])
  const toggleAluno = (aluno: Aluno) => {
    setAlunosSelecionados(prev =>
      prev.some(a => a.id === aluno.id)
        ? prev.filter(a => a.id !== aluno.id)
        : [...prev, aluno]
    )
  }

  const isFormValid = alunosSelecionados.length > 0

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Avaliação Diagnóstica" fixed />

      <WizardScrollView>
        <ProgressFill
          completedSections={currentStep}
          totalSections={totalSteps}
        />

        {/* 🔥 COMPONENTE REUTILIZÁVEL */}
        <AlunoSelection
          alunos={alunos}
          escolas={escolas}
          selectedAlunos={alunosSelecionados}
          onToggleAluno={toggleAluno}
        />

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Próxima Etapa"
            onPress={() =>
              router.push('/avaliacaoDiagnostica/criacao/step3-areas')
            }
            disabled={!isFormValid}
            buttonColor={{
              backgroundColor: isFormValid
                ? colors.primary2
                : colors.greyBlur,
            }}
            textColor={colors.textSecondary}
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
  buttonContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 40,
  },
})
