import { Image, StyleSheet } from 'react-native'
interface LogoProps {
  width?: number
  height?: number
}
const Logo: React.FC<LogoProps> = ({ width, height }) => {
  return (
    <Image
      source={require('../assets/images/logo-plural-plataforma.png')}
      style={[styles.logo, { width: width, height: height }]}
    />
  )
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
    resizeMode: 'contain',
    marginVertical: 20
  }
})

export default Logo
