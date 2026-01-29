export const STEP_ORDER = [
  'step1-identificacao',
  'step2-alunos',
  'step3-areas',
  'step4-preview',
] as const;

export type StepName = typeof STEP_ORDER[number];