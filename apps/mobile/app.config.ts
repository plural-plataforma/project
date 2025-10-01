import { config } from 'dotenv'
import { ConfigContext, ExpoConfig } from 'expo/config'
import path from 'path'

// Carrega o .env da raiz do monorepo
config({ path: path.resolve(__dirname, '../../.env') })

export default ({ config }: ConfigContext): ExpoConfig => {
  console.log('API_URL carregada no app.config.ts:', process.env.API_URL) // Adiciona log para depuração
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
      name: 'Plural-App',
      slug: 'Plural-App',
      extra: {
        API_URL: process.env.API_URL || 'http://localhost:5145/api/'
      },
      expoRouter: {
        root: './app/screens'
      }
    }
  } as ExpoConfig
}
