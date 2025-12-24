import { ExpoConfig } from '@expo/config-types'
import path from 'path'

// Load .env if possible. During EAS config evaluation the builder may not have
// all node_modules installed yet, so require('dotenv') can fail. Use a
// defensive require so evaluation doesn't crash.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv')
  if (dotenv && typeof dotenv.config === 'function') {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') })
  }
} catch (e) {
  // dotenv not available in the current environment; continue without it
}

const API_URL = process.env.API_URL || 'http://localhost:5145/api/'

const config: ExpoConfig = {
  name: 'app-plural',
  slug: 'app-plural',
  version: '1.0.0',
  orientation: 'portrait',
  icon: '../../packages/ui/assets/images/icon.png',
  scheme: 'plural-plataforma',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  owner: 'plural_apps',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.criativar.mobile',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.criativar.mobile',
    adaptiveIcon: {
      backgroundColor: '#ffffff',
      foregroundImage: '../../packages/ui/assets/images/android-icon-foreground.png',
      backgroundImage: '../../packages/ui/assets/images/android-icon-background.png',
      monochromeImage: '../../packages/ui/assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    entryPoint: './web/index.tsx',
    bundler: 'metro',
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
      projectId: 'af6e8d03-cd76-4399-8f28-2f3d244c8436',
    },
  },
}

export default config
