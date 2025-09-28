import 'dotenv/config'
import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
<<<<<<< HEAD
<<<<<<< HEAD
=======
  process.env.EXPO_ROUTER_APP_ROOT = './app'
  return {
    ...config
  }
=======
>>>>>>> 8bc3cf46c6ab5a7ec409f80bd03f4f9bbeb71872
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
      expoRouter: {
        root: './app'
      }
    }
  } as ExpoConfig
<<<<<<< HEAD
=======
  process.env.EXPO_ROUTER_APP_ROOT = './app'
  return {
    ...config
  }
>>>>>>> acf38d1 (fix: configuration expo router [PLUR-14])
=======
>>>>>>> 51fe25d65a4986d951f44b633b0b17e73155ce4d
>>>>>>> 8bc3cf46c6ab5a7ec409f80bd03f4f9bbeb71872
}
