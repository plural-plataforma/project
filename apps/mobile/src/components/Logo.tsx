import { Image, StyleProp, TextStyle, ViewStyle, ImageStyle } from 'react-native'

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
  'logo-padrao': require('../../../../packages/ui/assets/images/logo-plural-plataforma.png'),
  'logo-contrast': require('../../../../packages/ui/assets/images/logo-plural-plataforma-contrast.png'),
  'logo-inicial': require('../../../../packages/ui/assets/images/logo_ini.png'),
  'logo': require('../../../../packages/ui/assets/images/logo.png'),
}

const Logo: React.FC<LogoProps> = ({ width, height, href = 'logo-padrao', styles = {} }) => {
  return (
    <Image
      source={logos[href]}
      style={[styles.logo, {
        resizeMode: 'contain', width: width, height: height,
      }]}
    />
  )
}

export default Logo
