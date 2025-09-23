import 'dotenv/config'
import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
<<<<<<< HEAD
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
      expoRouter: {
        root: './app'
      }
    }
  } as ExpoConfig
=======
  process.env.EXPO_ROUTER_APP_ROOT = './app'
  return {
    ...config
  }
>>>>>>> acf38d1 (fix: configuration expo router [PLUR-14])
}
