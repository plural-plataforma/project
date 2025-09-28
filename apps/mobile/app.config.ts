import 'dotenv/config'
import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
      expoRouter: {
        root: './app'
      }
    }
  } as ExpoConfig
}
