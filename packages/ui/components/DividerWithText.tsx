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
    width: '72%',
    alignSelf: 'center',
    marginVertical: 40,
    margin: 0
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.secondary
  },
  dividerText: {
    paddingHorizontal: 10,
    color: colors.primary,
    fontSize: fontSizes.base,
    fontFamily: 'Nunito_400Regular'
  }
})

export default DividerWithText
