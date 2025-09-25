import * as React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Card, Text } from 'react-native-paper'
import { StatusBar } from 'expo-status-bar'
import { List } from 'phosphor-react-native'
export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.text}>
            Plural <Text style={styles.textSecondary}>PLATAFORMA</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <List size={24} color="#193656" />
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
    backgroundColor: '#fff'
  },

  header: {
    backgroundColor: '#FFBE33',
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
    color: '#193656',
    fontFamily: 'Nunito_700Bold'
  },
  textSecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: '#193656',
    fontFamily: 'Nunito_400Regular',
    textTransform: 'uppercase'
  },
  logo: {
    width: 42.79,
    height: 33.65,
    marginRight: 10
  }
})
