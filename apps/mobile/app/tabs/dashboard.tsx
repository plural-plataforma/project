import * as React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { StatusBar } from 'expo-status-bar'
import { List } from 'phosphor-react-native'
<<<<<<< HEAD
import { colors } from '../../../../packages/ui/theme/theme'
=======
>>>>>>> e49611b (feat: Navegação por tabs e stacks [PLUR-14])
export default function Dashboard() {
  return (
    <View style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.text}>
            Plural <Text style={styles.textSecondary}>PLATAFORMA</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
<<<<<<< HEAD
          <List size={24} color={colors.primary} />
=======
          <List size={24} color="#193656" />
>>>>>>> e49611b (feat: Navegação por tabs e stacks [PLUR-14])
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Card
          style={{
            height: 136,
            margin: 16,
            padding: 16,
            backgroundColor: '#FF0000'
          }}
        >
          <Text>Bem-vindo à Plural Plataforma!</Text>
        </Card>
      </View>
    </View>
  )
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: colors.background
  },

  header: {
    backgroundColor: colors.tertiary,
=======
    backgroundColor: '#fff'
  },

  header: {
    backgroundColor: '#FFBE33',
>>>>>>> e49611b (feat: Navegação por tabs e stacks [PLUR-14])
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
<<<<<<< HEAD
    color: colors.primary,
=======
    color: '#193656',
>>>>>>> e49611b (feat: Navegação por tabs e stacks [PLUR-14])
    fontFamily: 'Nunito_700Bold'
  },
  textSecondary: {
    fontSize: 16,
    fontWeight: '400',
<<<<<<< HEAD
    color: colors.primary,
=======
    color: '#193656',
>>>>>>> e49611b (feat: Navegação por tabs e stacks [PLUR-14])
    fontFamily: 'Nunito_400Regular',
    textTransform: 'uppercase'
  },
  logo: {
    width: 42.79,
    height: 33.65,
    marginRight: 10
  }
})
