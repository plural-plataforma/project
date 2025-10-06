// types/expo.d.ts
import 'expo-constants'
import { ExpoConfig } from '@expo/config-types'

declare module 'expo-constants' {
  interface ExpoConfig {
    extra: {
      API_URL: string
      JWTSETTINGS__SECRET?: string
    }
  }
}
