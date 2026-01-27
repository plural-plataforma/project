import { colors } from '@packages/ui/theme/theme'
import { Text, View, StyleSheet} from 'react-native'

export default function Planejamento() {
  return (

    <View style={styles.container}>
      <Text style={styles.text}>Em breve disponivel</Text>
    </View>
  )
}

export  const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: colors.background,
    alignItems: 'center', 
    justifyContent: 'center'
  },  
  text: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,  
    fontFamily: 'Nunito_700Bold',
    paddingInlineStart: 10,
  },
})  
