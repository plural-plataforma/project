import { Image, StyleSheet } from 'react-native'
interface LogoProps {
  width?: number
  height?: number
  href?: keyof typeof logos
}

const logos = {
  'logo-padrao': require('../assets/images/logo-plural-plataforma.png'),
  'logo-contrast': require('../assets/images/logo-plural-plataforma-contrast.png')
}

const Logo: React.FC<LogoProps> = ({ width, height, href = 'logo-padrao' }) => {
  return (
    <Image
      source={logos[href]}
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
