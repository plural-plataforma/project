import { describe, it, expect, beforeEach } from 'vitest'
import {
  useAvaliacaoWizardStore,
  WIZARD_STEPS,
  type WizardStep,
} from './avaliacaoWizardStore'

describe('avaliacaoWizardStore', () => {
  beforeEach(() => {
    useAvaliacaoWizardStore.getState().reset()
  })

  it('inicia no step identificacao com data vazio', () => {
    const state = useAvaliacaoWizardStore.getState()
    expect(state.currentStep).toBe('identificacao')
    expect(state.data).toEqual({})
    expect(state.completedSteps.size).toBe(0)
  })

  describe('setStep', () => {
    it('atualiza currentStep', () => {
      useAvaliacaoWizardStore.getState().setStep('alunos')
      expect(useAvaliacaoWizardStore.getState().currentStep).toBe('alunos')
    })
  })

  describe('updateData', () => {
    it('merge partial no data', () => {
      useAvaliacaoWizardStore.getState().updateData({ titulo: 'Aval 1' })
      expect(useAvaliacaoWizardStore.getState().data.titulo).toBe('Aval 1')

      useAvaliacaoWizardStore.getState().updateData({ escolaId: 5 })
      expect(useAvaliacaoWizardStore.getState().data).toMatchObject({
        titulo: 'Aval 1',
        escolaId: 5,
      })
    })
  })

  describe('markStepComplete', () => {
    it('adiciona step ao completedSteps', () => {
      useAvaliacaoWizardStore.getState().markStepComplete('identificacao')
      expect(useAvaliacaoWizardStore.getState().completedSteps.has('identificacao')).toBe(true)
    })
  })

  describe('canNavigateTo', () => {
    it('permite navegar para identificacao (primeiro step) sempre', () => {
      expect(useAvaliacaoWizardStore.getState().canNavigateTo('identificacao')).toBe(true)
    })

    it('não permite navegar para alunos sem completar identificacao', () => {
      expect(useAvaliacaoWizardStore.getState().canNavigateTo('alunos')).toBe(false)
    })

    it('permite navegar para alunos após completar identificacao', () => {
      useAvaliacaoWizardStore.getState().markStepComplete('identificacao')
      expect(useAvaliacaoWizardStore.getState().canNavigateTo('alunos')).toBe(true)
    })

    it('não permite navegar para areas sem completar alunos', () => {
      useAvaliacaoWizardStore.getState().markStepComplete('identificacao')
      expect(useAvaliacaoWizardStore.getState().canNavigateTo('areas')).toBe(false)
    })

    it('permite navegar para preview após completar areas', () => {
      ;(['identificacao', 'alunos', 'areas'] as WizardStep[]).forEach((step) => {
        useAvaliacaoWizardStore.getState().markStepComplete(step)
      })
      expect(useAvaliacaoWizardStore.getState().canNavigateTo('preview')).toBe(true)
    })
  })

  describe('reset', () => {
    it('restaura estado inicial', () => {
      useAvaliacaoWizardStore.getState().setStep('preview')
      useAvaliacaoWizardStore.getState().updateData({ titulo: 'X' })
      useAvaliacaoWizardStore.getState().markStepComplete('identificacao')

      useAvaliacaoWizardStore.getState().reset()

      expect(useAvaliacaoWizardStore.getState().currentStep).toBe('identificacao')
      expect(useAvaliacaoWizardStore.getState().data).toEqual({})
      expect(useAvaliacaoWizardStore.getState().completedSteps.size).toBe(0)
    })
  })
})
