import { config } from 'dotenv'
import { ExpoConfig } from '@expo/config-types'
import path from 'path'

config({ path: path.resolve(__dirname, '../../.env') })

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  console.log('API_URL carregada no app.config.ts:', process.env.API_URL)

  return {
    ...config,
    name: 'Plural-App',
    slug: 'Plural-App',
    extra: {
      API_URL: process.env.API_URL || 'http://localhost:5145/api/',
      INITIAL_API_TOKEN: process.env.INITIAL_API_TOKEN
    },
    experiments: {
      typedRoutes: true
    },
    plugins: ['expo-router']
  }
}
