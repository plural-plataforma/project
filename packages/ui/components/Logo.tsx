import { Image, StyleProp, TextStyle, ViewStyle , ImageStyle} from 'react-native'

interface LogoProps {
  width?: number
  height?: number
  href?: keyof typeof logos
  styles?: {
    view?: StyleProp<ViewStyle>;
    text?: StyleProp<TextStyle>;
    logo?: StyleProp<ImageStyle>;
  };
}

const logos = {
  'logo-padrao': require('../assets/images/logo-plural-plataforma.png'),
  'logo-contrast': require('../assets/images/logo-plural-plataforma-contrast.png')
}

const Logo: React.FC<LogoProps> = ({ width, height, href = 'logo-padrao', styles = {} }) => {
  return (
    <Image
      source={logos[href]}
      style={[styles.logo,{flex:1,
    resizeMode: 'contain', width: width, height: height }]}
    />
  )
}

export default Logo
