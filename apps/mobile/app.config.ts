import 'dotenv/config'
import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
<<<<<<< HEAD
  process.env.EXPO_ROUTER_APP_ROOT = './app'
  return {
    ...config
  }
=======
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
      expoRouter: {
        root: './app'
      }
    }
  } as ExpoConfig
>>>>>>> 51fe25d65a4986d951f44b633b0b17e73155ce4d
}
