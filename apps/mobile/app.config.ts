import 'dotenv/config'
import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
  process.env.EXPO_ROUTER_APP_ROOT = './app'
  return {
    ...config
  }
}
