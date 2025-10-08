import { colors, fontSizes } from '../theme/theme'
import { Text, View, StyleSheet } from 'react-native'

interface DividerWithTextProps {
  text: string
}

const DividerWithText: React.FC<DividerWithTextProps> = ({ text }) => {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  )
}

const styles = StyleSheet.create({
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    maxHeight: "100%",
    marginBottom:30
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.secondary,
    opacity:0.5
  },
  dividerText: {
    paddingHorizontal: 10,
    color: colors.primary,
    fontSize: fontSizes.f14,
    fontFamily: 'Nunito_400Regular'
  }
})

export default DividerWithText
