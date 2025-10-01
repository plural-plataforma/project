import { ExpoConfig } from 'expo/config'

// Extende a interface ExpoConfig para incluir expoRouter
declare module 'expo/config' {
  interface ExpoConfig {
    expo?: {
      expoRouter?: {
        root?: string
        // Adicione outras propriedades do expoRouter, se necessário
      }
    } & Partial<ExpoConfig['expo']> // Combina com as propriedades existentes de expo
  }
}
