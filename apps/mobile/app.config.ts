import { config as dotenvConfig } from 'dotenv'
import { ExpoConfig } from '@expo/config-types'
import path from 'path'

dotenvConfig({ path: path.resolve(__dirname, '../../.env') })

const API_URL = process.env.API_URL || 'http://localhost:5145/api/'

const config: ExpoConfig = {
  name: 'Plural-App',
  slug: 'testes-plural',
  version: '1.0.0',
  orientation: 'portrait',
  icon: '../../packages/ui/assets/images/icon.png',
  scheme: 'Plural-App',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  owner: 'plural-teste', // ✅ Adicionado aqui
  ios: {
    supportsTablet: true,
  },
  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.creis.mobile',
    adaptiveIcon: {
      backgroundColor: '#ffffff',
      foregroundImage: '../../packages/ui/assets/images/android-icon-foreground.png',
      backgroundImage: '../../packages/ui/assets/images/android-icon-background.png',
      monochromeImage: '../../packages/ui/assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    output: 'static',
    favicon: '../../packages/ui/assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: '../../packages/ui/assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    API_URL,
    eas: {
      projectId: '82f15ca1-a3ee-452c-b3a3-518bea07ec15',
    },
  },
}

export default config
