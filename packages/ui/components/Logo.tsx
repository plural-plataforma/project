import { Image, StyleSheet } from 'react-native'

const Logo: React.FC = () => {
  return (
    <Image
      source={require('../assets/images/logo-plural-plataforma.png')}
      style={styles.logo}
    />
  )
}

const styles = StyleSheet.create({
  logo: {
    width: 248,
    height: 87.29,
    alignSelf: 'center',
    resizeMode: 'contain'
  }
})

export default Logo
